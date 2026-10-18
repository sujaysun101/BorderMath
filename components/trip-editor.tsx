"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteTripAction, saveTripAction } from "@/actions/trips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRIES } from "@/lib/countries";
import type { Leg, Transport, Trip } from "@/lib/types";
import { CITIZENSHIP_OPTIONS } from "@/lib/visa-rules";
import type { LegAssessment } from "@/lib/compliance";

const schengen = COUNTRIES.filter((country) => country.schengen);
const other = COUNTRIES.filter((country) => !country.schengen);

export function TripEditor({
  trip,
  assessments,
  readOnly,
  basePath,
}: {
  trip: Trip;
  assessments: LegAssessment[];
  readOnly?: boolean;
  basePath: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(trip.name);
  const [citizenship, setCitizenship] = useState(trip.citizenship);
  const [notes, setNotes] = useState(trip.notes);
  const [legs, setLegs] = useState<Leg[]>(trip.legs);
  const [pending, start] = useTransition();

  function updateLeg(id: string, patch: Partial<Leg>) {
    setLegs((current) => current.map((leg) => (leg.id === id ? { ...leg, ...patch } : leg)));
  }

  function addLeg() {
    setLegs((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        countryCode: "PT",
        entryDate: "2026-01-01",
        exitDate: "2026-01-14",
        transport: "air" as Transport,
        sortOrder: current.length,
      },
    ]);
  }

  function move(index: number, direction: -1 | 1) {
    setLegs((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (readOnly) return;
        start(async () => {
          const result = await saveTripAction({
            id: trip.id,
            name,
            citizenship,
            notes,
            legs: legs.map((leg, index) => ({ ...leg, sortOrder: index })),
          });
          if (!result.ok) toast.error(result.error);
          else {
            toast.success("Trip saved");
            router.push(`${basePath}/trips/${trip.id}`);
            router.refresh();
          }
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="trip-name">Trip name</Label>
          <Input id="trip-name" value={name} disabled={readOnly} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="citizenship">Passport</Label>
          <select
            id="citizenship"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={citizenship}
            disabled={readOnly}
            onChange={(event) => setCitizenship(event.target.value)}
          >
            {CITIZENSHIP_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          value={notes}
          disabled={readOnly}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-3">
        {legs.map((leg, index) => {
          const assessment = assessments.find((item) => item.legId === leg.id);
          return (
            <fieldset key={leg.id} className="rounded-2xl border border-border bg-card p-4">
              <legend className="px-1 text-sm font-medium">Leg {index + 1}</legend>
              <div className="grid gap-3 md:grid-cols-4">
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Country</span>
                  <select
                    className="h-10 w-full rounded-xl border border-border bg-background px-3"
                    value={leg.countryCode}
                    disabled={readOnly}
                    aria-label={`Country for leg ${index + 1}`}
                    onChange={(event) => updateLeg(leg.id, { countryCode: event.target.value })}
                  >
                    <optgroup label="Schengen">
                      {schengen.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                          {country.deFacto ? " (counts as Schengen)" : ""}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other">
                      {other.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Entry</span>
                  <Input type="date" value={leg.entryDate} disabled={readOnly} aria-label={`Entry for leg ${index + 1}`} onChange={(event) => updateLeg(leg.id, { entryDate: event.target.value })} />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Exit</span>
                  <Input type="date" value={leg.exitDate} disabled={readOnly} aria-label={`Exit for leg ${index + 1}`} onChange={(event) => updateLeg(leg.id, { exitDate: event.target.value })} />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {assessment ? `${assessment.days} days · ${assessment.requirementLabel}` : "Save to score this leg."}
                  {assessment?.rule ? ` · ${assessment.rule.summary}` : ""}
                </p>
                {readOnly ? null : (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => move(index, -1)} aria-label={`Move leg ${index + 1} up`}>
                      Up
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => move(index, 1)} aria-label={`Move leg ${index + 1} down`}>
                      Down
                    </Button>
                    <label className="text-sm">
                      <span className="sr-only">Transport</span>
                      <select
                        className="h-8 rounded-full border border-border bg-background px-2"
                        value={leg.transport}
                        aria-label={`Transport for leg ${index + 1}`}
                        onChange={(event) => updateLeg(leg.id, { transport: event.target.value as Transport })}
                      >
                        <option value="air">Air</option>
                        <option value="land">Land</option>
                        <option value="sea">Sea</option>
                      </select>
                    </label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setLegs((current) => current.filter((item) => item.id !== leg.id))}>
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </fieldset>
          );
        })}
      </div>

      {readOnly ? (
        <p className="text-sm text-muted-foreground">This demo plan is read-only. Sign in to edit a copy of your own.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={addLeg}>
            Add leg
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save trip"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() =>
              start(async () => {
                const result = await deleteTripAction(trip.id);
                if (!result.ok) toast.error(result.error);
                else router.push(`${basePath}/trips`);
              })
            }
          >
            Delete
          </Button>
          <a className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm" href={`/api/trips/${trip.id}/calendar`}>
            Export .ics
          </a>
        </div>
      )}
    </form>
  );
}
