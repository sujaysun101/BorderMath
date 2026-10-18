import { describe, expect, it } from "vitest";
import { demoTrips } from "@/lib/demo-data";
import { tripToIcs } from "@/lib/ics";

describe("calendar export", () => {
  it("writes an all-day event per leg with an exclusive end date", () => {
    const ics = tripToIcs(demoTrips[0]);
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260105");
    expect(ics).toContain("DTEND;VALUE=DATE:20260218");
    expect(ics).toContain("SUMMARY:Portugal — Spring circuit");
    expect(ics).not.toContain("Schengen 90-day cap broken");
  });

  it("adds an overstay event when the trip itself breaks 90/180", () => {
    const draft = demoTrips.find((trip) => trip.id === "trip-draft");
    const ics = tripToIcs(draft!);
    expect(ics).toContain("SUMMARY:Schengen 90-day cap broken");
    expect(ics).toContain("BEGIN:VALARM");
  });
});
