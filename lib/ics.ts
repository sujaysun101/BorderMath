import { countryName } from "@/lib/countries";
import { addDays } from "@/lib/dates";
import { evaluateSchengen } from "@/lib/schengen";
import type { Trip } from "@/lib/types";

function fold(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function stamp(iso: string): string {
  return iso.replace(/-/g, "");
}

export function tripToIcs(trip: Trip): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BorderMath//Trip//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${fold(trip.name)}`,
  ];

  for (const leg of trip.legs) {
    const place = countryName(leg.countryCode);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${leg.id}@bordermath`,
      `DTSTAMP:${stamp(trip.createdAt.slice(0, 10))}T000000Z`,
      `DTSTART;VALUE=DATE:${stamp(leg.entryDate)}`,
      `DTEND;VALUE=DATE:${stamp(addDays(leg.exitDate, 1))}`,
      `SUMMARY:${fold(`${place} — ${trip.name}`)}`,
      `DESCRIPTION:${fold(`${leg.transport} entry ${leg.entryDate}, exit ${leg.exitDate}.`)}`,
      "END:VEVENT",
    );
  }

  const schengen = evaluateSchengen(trip.legs);
  if (schengen.firstOverstayDate) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${trip.id}-overstay@bordermath`,
      `DTSTAMP:${stamp(trip.createdAt.slice(0, 10))}T000000Z`,
      `DTSTART;VALUE=DATE:${stamp(schengen.firstOverstayDate)}`,
      `DTEND;VALUE=DATE:${stamp(addDays(schengen.firstOverstayDate, 1))}`,
      "SUMMARY:Schengen 90-day cap broken",
      `DESCRIPTION:${fold(schengen.notes.join(" "))}`,
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:Schengen cap",
      "END:VALARM",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
