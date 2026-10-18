import { describe, expect, it } from "vitest";
import { clearFxCache, convert, getFxQuote } from "@/lib/fx";

describe("FX quotes", () => {
  it("caches a Frankfurter response and converts through the base", async () => {
    clearFxCache();
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return {
        ok: true,
        json: async () => ({
          amount: 1,
          base: "USD",
          date: "2026-10-16",
          rates: { EUR: 0.9, GBP: 0.75, JPY: 150, THB: 33, MXN: 18, CAD: 1.4, CHF: 0.8 },
        }),
      };
    };
    const first = await getFxQuote("USD", { fetcher, now: 1_000 });
    const second = await getFxQuote("USD", { fetcher, now: 2_000 });
    expect(calls).toBe(1);
    expect(second.cached).toBe(true);
    expect(first.date).toBe("2026-10-16");
    expect(convert(first, 100, "USD", "EUR")).toBeCloseTo(90);
    expect(convert(first, 90, "EUR", "GBP")).toBeCloseTo(75);
  });

  it("refetches when forced or when the cache expires", async () => {
    clearFxCache();
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return {
        ok: true,
        json: async () => ({ date: "2026-10-16", rates: { EUR: 0.9, GBP: 0.75, JPY: 150, THB: 33, MXN: 18, CAD: 1.4, CHF: 0.8 } }),
      };
    };
    await getFxQuote("USD", { fetcher, now: 0 });
    await getFxQuote("USD", { fetcher, now: 7 * 60 * 60 * 1000 });
    await getFxQuote("USD", { fetcher, force: true, now: 1_000 });
    expect(calls).toBe(3);
  });
});
