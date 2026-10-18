import { describe, expect, it } from "vitest";
import { VISA_RULES, ruleFor } from "@/lib/visa-rules";

const DESTINATIONS = ["schengen", "GB", "US", "CA", "JP", "TH", "MX", "AE"] as const;
const CITIZENSHIPS = ["US", "GB", "CA", "JP", "IN"] as const;

describe("visa rules dataset", () => {
  it("covers Schengen, UK, US, Canada, Japan, Thailand, Mexico, and the UAE", () => {
    for (const citizenship of CITIZENSHIPS) {
      for (const destination of DESTINATIONS) {
        if (destination === citizenship) continue;
        const rule =
          destination === "schengen"
            ? ruleFor(citizenship, "FR", true)
            : ruleFor(citizenship, destination, false);
        expect(rule, `${citizenship} → ${destination}`).toBeTruthy();
        expect(rule?.sourceUrl.startsWith("https://")).toBe(true);
        expect(rule?.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(rule?.sourceTitle.length).toBeGreaterThan(3);
      }
    }
  });

  it("keeps the US Schengen row on the legal 90/180 rule", () => {
    const rule = ruleFor("US", "FR", true);
    expect(rule?.counting).toBe("rolling");
    expect(rule?.stayLimitDays).toBe(90);
    expect(rule?.windowDays).toBe(180);
    expect(rule?.requirement).toBe("visa-free");
  });

  it("records the September 2026 Thailand exemption as 30 days", () => {
    const rule = ruleFor("US", "TH", false);
    expect(rule?.stayLimitDays).toBe(30);
    expect(rule?.counting).toBe("per-stay");
    expect(rule?.requirement).toBe("visa-free");
  });

  it("has unique ids", () => {
    const ids = VISA_RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
