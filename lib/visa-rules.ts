import raw from "@/data/visa-rules.json";
import { z } from "zod";

const ruleSchema = z.object({
  id: z.string().min(1),
  destination: z.string().min(1),
  destinationCodes: z.array(z.string().length(2)),
  zone: z.enum(["schengen"]).optional(),
  citizenship: z.string().length(2),
  requirement: z.enum(["visa-free", "visa-on-arrival", "eta", "visa-required"]),
  stayLimitDays: z.number().int().positive().nullable(),
  stayLimitMonths: z.number().int().positive().nullable(),
  windowDays: z.number().int().positive().nullable(),
  counting: z.enum(["rolling", "per-stay", "per-admission", "none"]),
  passportAnchor: z.enum(["entry", "exit"]).nullable(),
  passportMonths: z.number().int().positive().nullable(),
  landEntriesPerYear: z.number().int().positive().nullable(),
  summary: z.string().min(1),
  notes: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceTitle: z.string().min(1),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const fileSchema = z.object({
  disclaimer: z.string().min(1),
  lastReviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rules: z.array(ruleSchema).min(1),
});

export type VisaRule = z.infer<typeof ruleSchema>;

const parsed = fileSchema.parse(raw);

export const VISA_DISCLAIMER = parsed.disclaimer;
export const VISA_RULES_REVIEWED = parsed.lastReviewed;
export const VISA_RULES: VisaRule[] = parsed.rules;

export function rulesForCitizenship(citizenship: string): VisaRule[] {
  return VISA_RULES.filter((rule) => rule.citizenship === citizenship);
}

export function ruleFor(citizenship: string, countryCode: string, schengen: boolean): VisaRule | undefined {
  return VISA_RULES.find((rule) => {
    if (rule.citizenship !== citizenship) return false;
    if (schengen) return rule.zone === "schengen";
    return rule.destinationCodes.includes(countryCode);
  });
}

export const CITIZENSHIP_OPTIONS = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "JP", name: "Japan" },
  { code: "IN", name: "India" },
] as const;
