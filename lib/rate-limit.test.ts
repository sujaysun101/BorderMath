import { describe, expect, it } from "vitest";
import { createMemoryLimiter } from "@/lib/rate-limit";

describe("in-memory rate limit", () => {
  it("allows a burst and then refuses", async () => {
    const limiter = createMemoryLimiter(3, 60_000);
    expect((await limiter.limit("a", 0)).ok).toBe(true);
    expect((await limiter.limit("a", 10)).ok).toBe(true);
    expect((await limiter.limit("a", 20)).ok).toBe(true);
    expect((await limiter.limit("a", 30)).ok).toBe(false);
    expect((await limiter.limit("b", 30)).ok).toBe(true);
    expect((await limiter.limit("a", 60_031)).ok).toBe(true);
  });
});
