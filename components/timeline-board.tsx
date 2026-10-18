import Link from "next/link";
import { countryName, isSchengen } from "@/lib/countries";
import { dayNumber, formatShort, inclusiveDays } from "@/lib/dates";
import type { Trip } from "@/lib/types";

export function TimelineBoard({ trips, basePath }: { trips: Trip[]; basePath: string }) {
  const stamps = trips.flatMap((trip) => trip.legs.flatMap((leg) => [dayNumber(leg.entryDate), dayNumber(leg.exitDate)]));
  if (stamps.length === 0) {
    return <p className="text-sm text-muted-foreground">Add a trip to see the year laid out.</p>;
  }
  const start = Math.min(...stamps);
  const end = Math.max(...stamps);
  const span = Math.max(1, end - start);
  const ticks = [start, Math.round((start + end) / 2), end];

  return (
    <div className="space-y-4" data-testid="timeline">
      <div className="flex justify-between text-xs text-muted-foreground">
        {ticks.map((tick) => (
          <span key={tick}>{formatShort(new Date(tick * 86_400_000).toISOString().slice(0, 10))}</span>
        ))}
      </div>
      <div className="space-y-3">
        {trips.map((trip) => (
          <div key={trip.id} className="grid grid-cols-1 gap-2 md:grid-cols-[160px_1fr] md:items-center">
            <Link href={`${basePath}/trips/${trip.id}`} className="truncate text-sm font-medium hover:underline">
              {trip.name}
            </Link>
            <div className="relative h-10 rounded-full bg-muted">
              {trip.legs.map((leg) => {
                const left = ((dayNumber(leg.entryDate) - start) / span) * 100;
                const width = Math.max(1.5, (inclusiveDays(leg.entryDate, leg.exitDate) / (span + 1)) * 100);
                const schengen = isSchengen(leg.countryCode);
                return (
                  <span
                    key={leg.id}
                    title={`${countryName(leg.countryCode)} ${leg.entryDate} – ${leg.exitDate}`}
                    className={`absolute top-1.5 h-7 rounded-full ${schengen ? "bg-primary" : "bg-accent"}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="flex gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-primary" /> Schengen</span>
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-accent" /> Outside Schengen</span>
      </p>
    </div>
  );
}
