import { describe, expect, it } from "vitest";
import { evaluateRollingWindow, evaluateSchengen } from "@/lib/schengen";
import { inclusiveDays } from "@/lib/dates";

describe("Schengen 90/180", () => {
  it("counts a single entry/exit day as one day", () => {
    const result = evaluateSchengen([
      { countryCode: "FR", entryDate: "2025-06-01", exitDate: "2025-06-01" },
    ]);
    expect(result.presenceDays).toBe(1);
    expect(result.maxDays).toBe(1);
    expect(result.isCompliant).toBe(true);
    expect(result.overstayDays).toBe(0);
  });

  it("treats exactly 90 consecutive days as compliant", () => {
    const result = evaluateSchengen([
      { countryCode: "ES", entryDate: "2025-01-01", exitDate: "2025-03-31" },
    ]);
    expect(inclusiveDays("2025-01-01", "2025-03-31")).toBe(90);
    expect(result.maxDays).toBe(90);
    expect(result.isCompliant).toBe(true);
    expect(result.overstayDays).toBe(0);
    expect(result.bufferBreached).toBe(true);
  });

  it("treats 91 consecutive days as a one-day overstay", () => {
    const result = evaluateSchengen([
      { countryCode: "IT", entryDate: "2025-01-01", exitDate: "2025-04-01" },
    ]);
    expect(result.maxDays).toBe(91);
    expect(result.isCompliant).toBe(false);
    expect(result.overstayDays).toBe(1);
    expect(result.firstOverstayDate).toBe("2025-04-01");
  });

  it("warns above 88 days without calling 89 or 90 an overstay", () => {
    const eightyNine = evaluateSchengen([
      { countryCode: "PT", entryDate: "2025-01-01", exitDate: "2025-03-30" },
    ]);
    expect(eightyNine.maxDays).toBe(89);
    expect(eightyNine.isCompliant).toBe(true);
    expect(eightyNine.bufferBreached).toBe(true);
    expect(eightyNine.overstayDays).toBe(0);

    const eightyEight = evaluateSchengen([
      { countryCode: "PT", entryDate: "2025-01-01", exitDate: "2025-03-29" },
    ]);
    expect(eightyEight.maxDays).toBe(88);
    expect(eightyEight.bufferBreached).toBe(false);
    expect(eightyEight.isCompliant).toBe(true);
  });

  it("drops a day once it falls outside the 180-day window", () => {
    const tooSoon = evaluateSchengen([
      { countryCode: "FR", entryDate: "2025-01-01", exitDate: "2025-03-31" },
      { countryCode: "DE", entryDate: "2025-06-29", exitDate: "2025-06-29" },
    ]);
    expect(tooSoon.maxDays).toBe(91);
    expect(tooSoon.isCompliant).toBe(false);
    expect(tooSoon.firstOverstayDate).toBe("2025-06-29");

    const onTheDay = evaluateSchengen([
      { countryCode: "FR", entryDate: "2025-01-01", exitDate: "2025-03-31" },
      { countryCode: "DE", entryDate: "2025-06-30", exitDate: "2025-06-30" },
    ]);
    expect(onTheDay.maxDays).toBe(90);
    expect(onTheDay.isCompliant).toBe(true);
    expect(onTheDay.overstayDays).toBe(0);
  });

  it("shares one pool across Schengen countries and ignores days outside it", () => {
    const result = evaluateSchengen([
      { countryCode: "GB", entryDate: "2025-01-01", exitDate: "2025-03-31" },
      { countryCode: "FR", entryDate: "2025-04-01", exitDate: "2025-04-20" },
      { countryCode: "ES", entryDate: "2025-04-21", exitDate: "2025-05-10" },
    ]);
    expect(result.presenceDays).toBe(40);
    expect(result.maxDays).toBe(40);
    expect(result.isCompliant).toBe(true);
  });

  it("does not double-count overlapping stays", () => {
    const result = evaluateSchengen([
      { countryCode: "FR", entryDate: "2025-01-01", exitDate: "2025-01-10" },
      { countryCode: "DE", entryDate: "2025-01-05", exitDate: "2025-01-15" },
    ]);
    expect(result.presenceDays).toBe(15);
    expect(result.maxDays).toBe(15);
  });

  it("counts Bulgaria, Romania, and de facto Monaco toward the same cap", () => {
    const result = evaluateSchengen([
      { countryCode: "BG", entryDate: "2026-01-01", exitDate: "2026-01-30" },
      { countryCode: "RO", entryDate: "2026-02-01", exitDate: "2026-03-02" },
      { countryCode: "MC", entryDate: "2026-03-03", exitDate: "2026-03-12" },
    ]);
    expect(result.presenceDays).toBe(30 + 30 + 10);
    expect(result.maxDays).toBe(70);
  });

  it("returns a compliant empty result when nothing is in Schengen", () => {
    const result = evaluateSchengen([
      { countryCode: "TH", entryDate: "2026-05-01", exitDate: "2026-05-20" },
    ]);
    expect(result.isCompliant).toBe(true);
    expect(result.maxDays).toBe(0);
    expect(result.notes[0]).toMatch(/No Schengen/);
  });

  it("uses a sliding window rather than a calendar-year total", () => {
    const result = evaluateRollingWindow(
      [
        { entryDate: "2025-01-01", exitDate: "2025-03-31", counts: true },
        { entryDate: "2025-12-01", exitDate: "2025-12-30", counts: true },
      ],
      { limit: 90, windowDays: 180, bufferDays: 2, label: "Schengen" },
    );
    expect(result.maxDays).toBe(90);
    expect(result.isCompliant).toBe(true);
  });
});
