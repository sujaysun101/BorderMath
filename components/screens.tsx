import Link from "next/link";
import { notFound } from "next/navigation";
import { BriefPanel } from "@/components/brief-panel";
import { DashboardView } from "@/components/dashboard-view";
import { FxPanel } from "@/components/fx-panel";
import { TimelineBoard } from "@/components/timeline-board";
import { TripEditor } from "@/components/trip-editor";
import { VaultPanel } from "@/components/vault-panel";
import { Badge } from "@/components/ui/badge";
import { buildSampleBrief } from "@/lib/ai";
import { assessLeg, buildAlerts } from "@/lib/compliance";
import { formatDay, inclusiveDays } from "@/lib/dates";
import { countryName } from "@/lib/countries";
import { evaluateSchengen } from "@/lib/schengen";
import { getStore } from "@/lib/store";
import { VISA_DISCLAIMER, VISA_RULES_REVIEWED } from "@/lib/visa-rules";
import { loadWorkspace } from "@/lib/workspace";
import { getFxQuote, type FxQuote } from "@/lib/fx";

export async function DashboardScreen({
  userId,
  basePath,
  forceMemory,
}: {
  userId: string;
  basePath: string;
  forceMemory?: boolean;
}) {
  const data = await loadWorkspace(userId, { forceMemory });
  return <DashboardView data={data} basePath={basePath} />;
}

export async function TripsScreen({
  userId,
  basePath,
  forceMemory,
  readOnly,
}: {
  userId: string;
  basePath: string;
  forceMemory?: boolean;
  readOnly?: boolean;
}) {
  const trips = await getStore({ forceMemory }).listTrips(userId);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Trips</h1>
          <p className="mt-2 text-muted-foreground">Each leg is scored against the sourced rule for the passport on the trip.</p>
        </div>
        {readOnly ? null : (
          <Link href={`${basePath}/trips/new`} className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm text-primary-foreground">
            New trip
          </Link>
        )}
      </div>
      <div className="grid gap-3">
        {trips.map((trip) => {
          const schengen = evaluateSchengen(trip.legs);
          const days = trip.legs.reduce((sum, leg) => sum + inclusiveDays(leg.entryDate, leg.exitDate), 0);
          return (
            <Link key={trip.id} href={`${basePath}/trips/${trip.id}`} className="rounded-2xl border border-border bg-card p-5 hover:border-primary">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-2xl">{trip.name}</h2>
                <Badge variant={schengen.presenceDays === 0 ? "secondary" : schengen.isCompliant ? "warning" : "critical"}>
                  {schengen.presenceDays === 0 ? "No Schengen days" : schengen.isCompliant ? `${schengen.maxDays}/90 Schengen` : `${schengen.overstayDays} over`}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {trip.citizenship} passport · {days} days · {trip.legs.map((leg) => countryName(leg.countryCode)).join(" → ")}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export async function TripScreen({
  userId,
  tripId,
  basePath,
  forceMemory,
  readOnly,
  blank,
}: {
  userId: string;
  tripId: string;
  basePath: string;
  forceMemory?: boolean;
  readOnly?: boolean;
  blank?: boolean;
}) {
  const store = getStore({ forceMemory });
  const profile = await store.getProfile(userId);
  const trip = blank
    ? {
        id: tripId,
        userId,
        name: "Untitled trip",
        citizenship: profile.citizenships[0] ?? "US",
        notes: "",
        legs: [],
        createdAt: new Date().toISOString(),
      }
    : await store.getTrip(userId, tripId);
  if (!trip) notFound();
  const assessments = trip.legs.map((leg) => assessLeg(leg, trip.citizenship));
  const schengen = evaluateSchengen(trip.legs);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Trip</p>
          <h1 className="font-serif text-4xl">{trip.name || "New trip"}</h1>
        </div>
        <Badge variant={schengen.isCompliant ? "secondary" : "critical"}>
          {schengen.presenceDays === 0 ? "No Schengen days yet" : schengen.notes[0]}
        </Badge>
      </div>
      <TripEditor trip={trip} assessments={assessments} readOnly={readOnly} basePath={basePath} />
      <p className="text-sm text-muted-foreground">
        Both the entry day and the exit day count. On each day inside Schengen, the previous 180 days are totaled, including that day.
      </p>
    </div>
  );
}

export async function TimelineScreen({
  userId,
  basePath,
  forceMemory,
}: {
  userId: string;
  basePath: string;
  forceMemory?: boolean;
}) {
  const trips = await getStore({ forceMemory }).listTrips(userId);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Timeline</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Teal bars are Schengen days and share one 90/180 pool. Amber bars sit outside it, which is why a UK or Thailand stretch does not add Schengen days.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <TimelineBoard trips={trips} basePath={basePath} />
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {trips.flatMap((trip) =>
          trip.legs.map((leg) => (
            <li key={leg.id}>
              {formatDay(leg.entryDate)} – {formatDay(leg.exitDate)} · {countryName(leg.countryCode)} · {inclusiveDays(leg.entryDate, leg.exitDate)} days
            </li>
          )),
        )}
      </ul>
    </div>
  );
}

export async function AlertsScreen({ userId, forceMemory }: { userId: string; forceMemory?: boolean }) {
  const store = getStore({ forceMemory });
  const [trips, profile, visas] = await Promise.all([
    store.listTrips(userId),
    store.getProfile(userId),
    store.listVisas(userId),
  ]);
  const alerts = buildAlerts(trips, profile, visas);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Alerts</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{VISA_DISCLAIMER}</p>
        <p className="mt-1 text-sm text-muted-foreground">Dataset last reviewed {VISA_RULES_REVIEWED}.</p>
      </div>
      {alerts.length === 0 ? <p>No alerts on the current plans.</p> : null}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h2 className="font-medium">{alert.title}</h2>
              <Badge variant={alert.severity === "critical" ? "critical" : alert.severity === "warning" ? "warning" : "secondary"}>
                {alert.severity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{alert.detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export async function FxScreen({ basePath, force }: { basePath: string; force?: boolean }) {
  let quote: FxQuote | null = null;
  let error: string | null = null;
  try {
    quote = await getFxQuote("USD", { force });
  } catch {
    error = "Frankfurter is unreachable right now. No made-up rates are shown.";
  }
  return <FxPanel quote={quote} error={error} basePath={basePath} />;
}

export async function VaultScreen({
  userId,
  forceMemory,
  readOnly,
}: {
  userId: string;
  forceMemory?: boolean;
  readOnly?: boolean;
}) {
  const store = getStore({ forceMemory });
  const [profile, visas] = await Promise.all([store.getProfile(userId), store.listVisas(userId)]);
  return <VaultPanel profile={profile} visas={visas} readOnly={readOnly} />;
}

export async function BriefScreen({
  userId,
  forceMemory,
  live,
}: {
  userId: string;
  forceMemory?: boolean;
  live: boolean;
}) {
  const store = getStore({ forceMemory });
  const [trips, profile, visas] = await Promise.all([
    store.listTrips(userId),
    store.getProfile(userId),
    store.listVisas(userId),
  ]);
  const alerts = buildAlerts(trips, profile, visas);
  const initial = live ? null : buildSampleBrief(trips[0] ?? null, alerts);
  return <BriefPanel trips={trips.map((trip) => ({ id: trip.id, name: trip.name }))} initial={initial} live={live} />;
}
