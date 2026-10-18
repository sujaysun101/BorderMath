"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Brief } from "@/lib/ai";

export function BriefPanel({
  trips,
  initial,
  live,
}: {
  trips: { id: string; name: string }[];
  initial: Brief | null;
  live: boolean;
}) {
  const [tripId, setTripId] = useState(trips[0]?.id ?? "");
  const [brief, setBrief] = useState<Brief | null>(initial);
  const [pending, setPending] = useState(false);

  async function generate() {
    setPending(true);
    try {
      const response = await fetch("/api/ai/brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tripId }),
      });
      const payload = (await response.json()) as Brief & { error?: string };
      if (!response.ok) {
        toast.error(payload.error ?? "The brief failed.");
        return;
      }
      setBrief(payload);
    } catch {
      toast.error("The brief failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Mobility brief</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          The model runs on the server, sees the day counts this app already computed, and cannot invent a different total.
          Without an API key you get a labeled sample built from those same counts.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Trip</span>
          <select
            className="h-10 rounded-xl border border-border bg-background px-3"
            value={tripId}
            onChange={(event) => setTripId(event.target.value)}
          >
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.name}
              </option>
            ))}
          </select>
        </label>
        {live ? (
          <Button type="button" onClick={generate} disabled={pending || !tripId}>
            {pending ? "Writing…" : "Generate brief"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Sign in to request a live model brief. The sample below uses the demo plan.</p>
        )}
      </div>
      {brief ? (
        <article className="space-y-4 rounded-2xl border border-border bg-card p-6">
          {brief.sample ? <Badge variant="warning">Sample response</Badge> : <Badge>Model response</Badge>}
          <h2 className="font-serif text-3xl">{brief.headline}</h2>
          <p className="max-w-3xl text-muted-foreground">{brief.summary}</p>
          <ul className="space-y-3">
            {brief.risks.map((risk) => (
              <li key={risk.title} className="rounded-xl border border-border p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="font-medium">{risk.title}</h3>
                  <Badge variant={risk.severity === "critical" ? "critical" : risk.severity === "warning" ? "warning" : "secondary"}>
                    {risk.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{risk.detail}</p>
              </li>
            ))}
          </ul>
          <div>
            <h3 className="text-sm font-medium">Places to research outside Schengen</h3>
            <p className="text-sm text-muted-foreground">{brief.pivots.join(" · ")}</p>
          </div>
        </article>
      ) : null}
    </div>
  );
}
