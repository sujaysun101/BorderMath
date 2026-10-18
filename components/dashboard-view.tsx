import Link from "next/link";
import { CountryChart, SchengenChart } from "@/components/charts";
import { TimelineBoard } from "@/components/timeline-board";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downsampleSeries } from "@/lib/compliance";
import { formatDay } from "@/lib/dates";
import type { Workspace } from "@/lib/workspace";
import { LoadSampleButton } from "@/components/load-sample";

export function DashboardView({ data, basePath }: { data: Workspace; basePath: string }) {
  const critical = data.alerts.filter((alert) => alert.severity === "critical").length;
  const series = downsampleSeries(data.schengen.series);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Rolling 180-day window</p>
          <h1 className="font-serif text-4xl tracking-tight md:text-5xl">
            {data.profile.displayName ? `${data.profile.displayName.split(" ")[0]}'s year` : "Your year"}
          </h1>
        </div>
        <Badge variant={data.schengen.isCompliant ? "warning" : "critical"}>
          {data.schengen.isCompliant ? "Inside the 90-day cap" : `${data.schengen.overstayDays} day overstay`}
        </Badge>
      </div>

      {data.trips.length === 0 ? (
        <Card>
          <CardContent className="space-y-3">
            <p>No trips yet. Load the sample nomad year or start a blank plan.</p>
            <div className="flex gap-2">
              <LoadSampleButton />
              <Link href={`${basePath}/trips/new`} className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm">
                New trip
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Peak days in window" value={`${data.schengen.maxDays}`} hint="Legal cap is 90" danger={!data.schengen.isCompliant} />
            <Stat label="Days of presence" value={`${data.schengen.presenceDays}`} hint="Entry and exit both count" />
            <Stat label="Open alerts" value={`${data.alerts.length}`} hint={`${critical} critical`} danger={critical > 0} />
            <Stat
              label="USD to EUR"
              value={data.fx ? data.fx.rates.EUR.toFixed(3) : "—"}
              hint={data.fx ? `Frankfurter ${data.fx.date}${data.fx.cached ? " · cached" : ""}` : data.fxError ?? "No rate"}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Schengen days in the window</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gold line is the 88-day safety buffer. Red line is the legal 90-day cap.
                  {data.schengen.criticalDate ? ` Peak on ${formatDay(data.schengen.criticalDate)}.` : ""}
                </p>
              </CardHeader>
              <CardContent>
                <SchengenChart data={series} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.alerts.slice(0, 5).map((alert) => (
                  <article key={alert.id} className="rounded-xl border border-border p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h2 className="text-sm font-medium">{alert.title}</h2>
                      <Badge variant={alert.severity === "critical" ? "critical" : alert.severity === "warning" ? "warning" : "secondary"}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.detail}</p>
                  </article>
                ))}
                <Link href={`${basePath}/alerts`} className="text-sm text-primary hover:underline">
                  All alerts
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Where the days go</CardTitle>
              </CardHeader>
              <CardContent>
                <CountryChart data={data.countries.map((row) => ({ name: row.name, days: row.days }))} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <TimelineBoard trips={data.trips} basePath={basePath} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint, danger }: { label: string; value: string; hint: string; danger?: boolean }) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`font-serif text-4xl ${danger ? "text-destructive" : ""}`}>{value}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
