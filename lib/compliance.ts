import { countryName, getCountry, isSchengen } from "@/lib/countries";
import { addDays, inclusiveDays, shiftMonths } from "@/lib/dates";
import { evaluateRollingWindow, evaluateSchengen, type RollingResult } from "@/lib/schengen";
import type { Leg, Profile, Trip, VisaDoc } from "@/lib/types";
import { ruleFor, type VisaRule } from "@/lib/visa-rules";

export type Alert = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  tripId?: string;
};

export type LegAssessment = {
  legId: string;
  countryCode: string;
  countryName: string;
  days: number;
  schengen: boolean;
  rule?: VisaRule;
  requirementLabel: string;
};

function requirementLabel(rule: VisaRule | undefined): string {
  if (!rule) return "No sourced rule";
  switch (rule.requirement) {
    case "visa-free":
      return "Visa-free";
    case "visa-on-arrival":
      return "Visa on arrival";
    case "eta":
      return "Authorization required";
    case "visa-required":
      return "Visa required";
    default:
      return rule.requirement;
  }
}

export function assessLeg(leg: Leg, citizenship: string): LegAssessment {
  const country = getCountry(leg.countryCode);
  const schengen = isSchengen(leg.countryCode);
  const rule = ruleFor(citizenship, leg.countryCode, schengen);
  return {
    legId: leg.id,
    countryCode: leg.countryCode,
    countryName: country?.name ?? leg.countryCode,
    days: inclusiveDays(leg.entryDate, leg.exitDate),
    schengen,
    rule,
    requirementLabel: requirementLabel(rule),
  };
}

function visaCovers(visas: VisaDoc[], countryCode: string, exitDate: string): boolean {
  return visas.some((visa) => visa.countryCode === countryCode && visa.expiryDate >= exitDate);
}

function pushStayAlerts(alerts: Alert[], trip: Trip, leg: Leg, rule: VisaRule) {
  const days = inclusiveDays(leg.entryDate, leg.exitDate);
  const place = countryName(leg.countryCode);
  if (rule.counting === "per-stay" || rule.counting === "per-admission") {
    const limitDays = rule.stayLimitDays;
    if (rule.stayLimitMonths) {
      const lastLegal = addDays(shiftMonths(leg.entryDate, rule.stayLimitMonths), -1);
      if (leg.exitDate > lastLegal) {
        alerts.push({
          id: `${trip.id}-${leg.id}-months`,
          severity: "critical",
          tripId: trip.id,
          title: `${place} runs past ${rule.stayLimitMonths} months`,
          detail: `${days} days from ${leg.entryDate} to ${leg.exitDate}. The sourced usual maximum ends ${lastLegal}.`,
        });
      } else if (leg.exitDate === lastLegal) {
        alerts.push({
          id: `${trip.id}-${leg.id}-months-cap`,
          severity: "warning",
          tripId: trip.id,
          title: `${place} uses the full ${rule.stayLimitMonths}-month stay`,
          detail: "The exit date is the last day of the published usual maximum.",
        });
      }
    }
    if (limitDays) {
      if (days > limitDays) {
        alerts.push({
          id: `${trip.id}-${leg.id}-days`,
          severity: "critical",
          tripId: trip.id,
          title: `${place} overstay of ${days - limitDays} day${days - limitDays === 1 ? "" : "s"}`,
          detail: `${days} days planned. The sourced limit is ${limitDays} days ${rule.counting === "per-stay" ? "per entry" : "per admission"}.`,
        });
      } else if (days === limitDays) {
        alerts.push({
          id: `${trip.id}-${leg.id}-days-cap`,
          severity: "warning",
          tripId: trip.id,
          title: `${place} uses the full ${limitDays}-day stay`,
          detail: "There is no spare day if a flight slips.",
        });
      }
    }
  }

  if (rule.counting === "none" && rule.requirement === "visa-required") {
    alerts.push({
      id: `${trip.id}-${leg.id}-visa`,
      severity: "warning",
      tripId: trip.id,
      title: `Visa required for ${place}`,
      detail: rule.summary,
    });
  }
}

function passportAlerts(alerts: Alert[], trip: Trip, leg: Leg, rule: VisaRule | undefined, profile: Profile) {
  if (!profile.passportExpiry) return;
  const expiry = profile.passportExpiry;
  const place = countryName(leg.countryCode);
  if (leg.entryDate > expiry) {
    alerts.push({
      id: `${trip.id}-${leg.id}-passport-expired`,
      severity: "critical",
      tripId: trip.id,
      title: `Passport expires before ${place}`,
      detail: `Expiry ${expiry} is before entry on ${leg.entryDate}.`,
    });
    return;
  }
  if (leg.exitDate > expiry) {
    alerts.push({
      id: `${trip.id}-${leg.id}-passport-during`,
      severity: "critical",
      tripId: trip.id,
      title: `Passport expires during ${place}`,
      detail: `Expiry ${expiry} falls inside ${leg.entryDate} to ${leg.exitDate}.`,
    });
    return;
  }
  if (rule?.passportAnchor && rule.passportMonths) {
    const anchor = rule.passportAnchor === "entry" ? leg.entryDate : leg.exitDate;
    const needed = shiftMonths(anchor, rule.passportMonths);
    if (expiry < needed) {
      alerts.push({
        id: `${trip.id}-${leg.id}-passport-rule`,
        severity: "warning",
        tripId: trip.id,
        title: `${place} passport validity looks short`,
        detail: `The sourced rule wants about ${rule.passportMonths} months beyond ${rule.passportAnchor}. You would need validity through ${needed}; the passport expires ${expiry}.`,
      });
      return;
    }
  }
  const personal = shiftMonths(leg.entryDate, profile.passportAlertMonths);
  if (expiry < personal) {
    alerts.push({
      id: `${trip.id}-${leg.id}-passport-personal`,
      severity: "warning",
      tripId: trip.id,
      title: `${place} is inside your passport alert window`,
      detail: `You asked for ${profile.passportAlertMonths} months of notice. The passport expires ${expiry}.`,
    });
  }
}

export function buildAlerts(trips: Trip[], profile: Profile, visas: VisaDoc[]): Alert[] {
  const alerts: Alert[] = [];
  const legs = trips.flatMap((trip) => trip.legs.map((leg) => ({ trip, leg })));

  const byCitizenship = new Map<string, { trip: Trip; leg: Leg }[]>();
  for (const item of legs) {
    const list = byCitizenship.get(item.trip.citizenship) ?? [];
    list.push(item);
    byCitizenship.set(item.trip.citizenship, list);
  }

  for (const [citizenship, items] of byCitizenship) {
    const schengen = evaluateSchengen(items.map((item) => item.leg));
    if (schengen.presenceDays > 0 && !schengen.isCompliant) {
      alerts.push({
        id: `schengen-${citizenship}-over`,
        severity: "critical",
        title: `Schengen overstay of ${schengen.overstayDays} day${schengen.overstayDays === 1 ? "" : "s"}`,
        detail: schengen.notes.join(" "),
      });
    } else if (schengen.bufferBreached) {
      alerts.push({
        id: `schengen-${citizenship}-buffer`,
        severity: "warning",
        title: `Schengen safety buffer is in play (${schengen.maxDays}/90)`,
        detail: schengen.notes.join(" "),
      });
    }

    const rollingRules = new Map<string, { rule: VisaRule; legs: Leg[] }>();
    for (const { leg } of items) {
      if (isSchengen(leg.countryCode)) continue;
      const rule = ruleFor(citizenship, leg.countryCode, false);
      if (rule?.counting === "rolling" && rule.stayLimitDays && rule.windowDays) {
        const bucket = rollingRules.get(rule.id) ?? { rule, legs: [] };
        bucket.legs.push(leg);
        rollingRules.set(rule.id, bucket);
      }
    }
    for (const { rule, legs: ruleLegs } of rollingRules.values()) {
      const result = evaluateRollingWindow(
        ruleLegs.map((leg) => ({ entryDate: leg.entryDate, exitDate: leg.exitDate, counts: true })),
        { limit: rule.stayLimitDays!, windowDays: rule.windowDays!, bufferDays: 0, label: rule.destination },
      );
      if (!result.isCompliant) {
        alerts.push({
          id: `rolling-${rule.id}`,
          severity: "critical",
          title: `${rule.destination} overstay of ${result.overstayDays} day${result.overstayDays === 1 ? "" : "s"}`,
          detail: result.notes.join(" "),
        });
      }
    }
  }

  const landCounts = new Map<string, { rule: VisaRule; count: number; tripId: string }>();

  for (const { trip, leg } of legs) {
    const schengen = isSchengen(leg.countryCode);
    const rule = ruleFor(trip.citizenship, leg.countryCode, schengen);
    if (rule && !schengen) pushStayAlerts(alerts, trip, leg, rule);
    if (rule?.requirement === "visa-required" && !visaCovers(visas, leg.countryCode, leg.exitDate) && rule.counting !== "none") {
      alerts.push({
        id: `${trip.id}-${leg.id}-need-visa`,
        severity: "warning",
        tripId: trip.id,
        title: `No vault visa covers ${countryName(leg.countryCode)}`,
        detail: `${rule.summary} Add the sticker to the vault once you have it.`,
      });
    }
    if (!rule && !schengen) {
      alerts.push({
        id: `${trip.id}-${leg.id}-unsourced`,
        severity: "info",
        tripId: trip.id,
        title: `No sourced stay limit for ${countryName(leg.countryCode)}`,
        detail: `A ${trip.citizenship} passport has no row in the dataset. Confirm the rule with the embassy before relying on this plan.`,
      });
    }
    passportAlerts(alerts, trip, leg, rule, profile);

    if (rule?.landEntriesPerYear && leg.transport !== "air") {
      const year = leg.entryDate.slice(0, 4);
      const key = `${trip.citizenship}-${leg.countryCode}-${year}`;
      const current = landCounts.get(key) ?? { rule, count: 0, tripId: trip.id };
      current.count += 1;
      landCounts.set(key, current);
    }
  }

  for (const [key, value] of landCounts) {
    if (value.rule.landEntriesPerYear && value.count > value.rule.landEntriesPerYear) {
      alerts.push({
        id: `land-${key}`,
        severity: "warning",
        tripId: value.tripId,
        title: `${value.rule.destination} land entries exceed ${value.rule.landEntriesPerYear} in a calendar year`,
        detail: value.rule.notes,
      });
    }
  }

  const rank = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || a.title.localeCompare(b.title));
}

export function personSchengen(trips: Trip[]): RollingResult {
  return evaluateSchengen(trips.flatMap((trip) => trip.legs));
}

export function daysByCountry(trips: Trip[]): { code: string; name: string; days: number; schengen: boolean }[] {
  const totals = new Map<string, number>();
  for (const trip of trips) {
    for (const leg of trip.legs) {
      totals.set(leg.countryCode, (totals.get(leg.countryCode) ?? 0) + inclusiveDays(leg.entryDate, leg.exitDate));
    }
  }
  return [...totals.entries()]
    .map(([code, days]) => ({
      code,
      name: countryName(code),
      days,
      schengen: isSchengen(code),
    }))
    .sort((a, b) => b.days - a.days);
}

export function downsampleSeries(series: { date: string; days: number }[], maxPoints = 160) {
  if (series.length <= maxPoints) return series;
  const step = Math.ceil(series.length / maxPoints);
  const sampled = series.filter((_, index) => index % step === 0);
  const last = series[series.length - 1];
  if (sampled[sampled.length - 1]?.date !== last.date) sampled.push(last);
  return sampled;
}
