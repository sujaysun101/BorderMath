import { z } from "zod";
import type { Alert } from "@/lib/compliance";
import type { Trip } from "@/lib/types";

export const MAX_BRIEF_TOKENS = 800;
export const DEFAULT_AI_MODEL = "claude-sonnet-4-5";

export const briefSchema = z.object({
  sample: z.boolean(),
  headline: z.string().min(1).max(180),
  summary: z.string().min(1).max(900),
  risks: z
    .array(
      z.object({
        severity: z.enum(["critical", "warning", "info"]),
        title: z.string().min(1).max(140),
        detail: z.string().min(1).max(400),
      }),
    )
    .max(6),
  pivots: z.array(z.string().min(1).max(80)).max(6),
});

export type Brief = z.infer<typeof briefSchema>;

export const briefRequestSchema = z.object({
  tripId: z.string().min(1).max(80),
});

const PIVOTS = ["United Kingdom", "Ireland", "Türkiye", "Georgia", "Albania", "Serbia"];

export function buildSampleBrief(trip: Trip | null, alerts: Alert[]): Brief {
  const relevant = trip ? alerts.filter((alert) => !alert.tripId || alert.tripId === trip.id) : alerts;
  const top = relevant.slice(0, 4);
  const risks =
    top.length > 0
      ? top.map((alert) => ({
          severity: alert.severity,
          title: alert.title,
          detail: alert.detail.slice(0, 400),
        }))
      : [
          {
            severity: "info" as const,
            title: "No sourced alert on this plan",
            detail: "The day-count engine did not find an overstay against the rules in the dataset.",
          },
        ];

  return briefSchema.parse({
    sample: true,
    headline: "Sample brief — no model key is configured",
    summary: trip
      ? `${trip.name} is paired with the account-level day counts from the Schengen engine and the sourced stay rules. This prose is a template, not a model response. Set ANTHROPIC_API_KEY to replace it.`
      : "No trip was selected. This is a labeled sample so the screen still demonstrates the brief.",
    risks,
    pivots: PIVOTS.slice(0, 4),
  });
}

export function briefPrompt(input: { trip: Trip; alerts: Alert[]; schengen: { maxDays: number; isCompliant: boolean; overstayDays: number } }) {
  return [
    "You are BorderMath, a mobility planner. Explain overstay risk for this itinerary.",
    "Use only the numbers and alerts provided. Do not invent visa fees, laws, or day counts.",
    "Non-Schengen places the traveler can research as pivots: United Kingdom, Ireland, Türkiye, Georgia, Albania, Serbia. Do not claim they are visa-free.",
    "Respond with JSON only, matching this shape:",
    '{"sample":false,"headline":"","summary":"","risks":[{"severity":"critical|warning|info","title":"","detail":""}],"pivots":[""]}',
    "Keep summary under 700 characters and at most 4 risks.",
    JSON.stringify({
      trip: {
        name: input.trip.name,
        citizenship: input.trip.citizenship,
        legs: input.trip.legs.map((leg) => ({
          country: leg.countryCode,
          entry: leg.entryDate,
          exit: leg.exitDate,
        })),
      },
      schengen: input.schengen,
      alerts: input.alerts.slice(0, 8).map((alert) => ({
        severity: alert.severity,
        title: alert.title,
        detail: alert.detail,
      })),
    }),
  ].join("\n");
}
