import { describe, expect, it } from "vitest";
import { buildAlerts } from "@/lib/compliance";
import { demoProfile, demoTrips, DEMO_USER_ID } from "@/lib/demo-data";
import { evaluateSchengen } from "@/lib/schengen";
import type { Trip } from "@/lib/types";

function trip(partial: Omit<Trip, "userId" | "createdAt" | "notes" | "citizenship"> & { citizenship?: string }): Trip {
  return {
    userId: "user",
    createdAt: "2026-01-01T00:00:00.000Z",
    notes: "",
    citizenship: partial.citizenship ?? "US",
    ...partial,
  };
}

describe("overstay alerts", () => {
  it("flags a Thailand stay past the 30-day exemption", () => {
    const alerts = buildAlerts(
      [
        trip({
          id: "t1",
          name: "Bangkok",
          legs: [
            {
              id: "l1",
              countryCode: "TH",
              entryDate: "2026-12-01",
              exitDate: "2026-12-31",
              transport: "air",
              sortOrder: 0,
            },
          ],
        }),
      ],
      { ...demoProfile, userId: "user", passportExpiry: "2030-01-01" },
      [],
    );
    expect(alerts.some((alert) => alert.severity === "critical" && alert.title.includes("Thailand"))).toBe(true);
  });

  it("flags a Schengen plan that breaks 90/180", () => {
    const alerts = buildAlerts(
      [
        trip({
          id: "t1",
          name: "Too long",
          legs: [
            {
              id: "l1",
              countryCode: "IT",
              entryDate: "2026-09-01",
              exitDate: "2026-11-30",
              transport: "air",
              sortOrder: 0,
            },
          ],
        }),
      ],
      { ...demoProfile, userId: "user", passportExpiry: "2030-01-01" },
      [],
    );
    expect(alerts.some((alert) => alert.id.startsWith("schengen-") && alert.severity === "critical")).toBe(true);
  });

  it("keeps the seeded spring circuit inside the legal cap and inside the buffer", () => {
    const spring = demoTrips.find((item) => item.id === "trip-spring");
    expect(spring).toBeTruthy();
    const result = evaluateSchengen(spring!.legs);
    expect(result.maxDays).toBe(89);
    expect(result.isCompliant).toBe(true);
    expect(result.bufferBreached).toBe(true);
  });

  it("catches the seeded draft against the real rolling window", () => {
    const owned = demoTrips.map((item) => ({ ...item, userId: DEMO_USER_ID }));
    const result = evaluateSchengen(owned.flatMap((item) => item.legs));
    expect(result.isCompliant).toBe(false);
    expect(result.overstayDays).toBeGreaterThan(0);
    const alerts = buildAlerts(owned, demoProfile, []);
    expect(alerts.some((alert) => alert.severity === "critical")).toBe(true);
  });
});
