import { z } from "zod";
import { getCountry } from "@/lib/countries";
import { CITIZENSHIP_OPTIONS } from "@/lib/visa-rules";

const citizenshipCodes = CITIZENSHIP_OPTIONS.map((item) => item.code) as [string, ...string[]];

export const legSchema = z
  .object({
    id: z.string().min(1).max(80),
    countryCode: z.string().length(2),
    entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    exitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    transport: z.enum(["air", "land", "sea"]),
    sortOrder: z.number().int().min(0).max(40),
  })
  .refine((leg) => leg.exitDate >= leg.entryDate, { message: "Exit date must be on or after entry." })
  .refine((leg) => Boolean(getCountry(leg.countryCode)), { message: "Unknown country." });

export const tripSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(1).max(80),
  citizenship: z.enum(citizenshipCodes),
  notes: z.string().max(500),
  legs: z.array(legSchema).max(24),
});

export const profileSchema = z.object({
  displayName: z.string().trim().max(80),
  citizenships: z.array(z.enum(citizenshipCodes)).min(1).max(3),
  passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  passportAlertMonths: z.number().int().min(1).max(24),
});

export const visaSchema = z.object({
  id: z.string().min(1).max(80),
  countryCode: z.string().length(2).refine((code) => Boolean(getCountry(code)), "Unknown country."),
  visaType: z.string().trim().min(1).max(80),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(300),
});

export function zodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}
