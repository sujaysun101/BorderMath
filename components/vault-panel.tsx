"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteVisaAction, saveProfileAction, saveVisaAction } from "@/actions/vault";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRIES } from "@/lib/countries";
import { formatDay } from "@/lib/dates";
import type { Profile, VisaDoc } from "@/lib/types";
import { CITIZENSHIP_OPTIONS } from "@/lib/visa-rules";

export function VaultPanel({ profile, visas, readOnly }: { profile: Profile; visas: VisaDoc[]; readOnly?: boolean }) {
  const [pending, start] = useTransition();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [citizenship, setCitizenship] = useState(profile.citizenships[0] ?? "US");
  const [passportExpiry, setPassportExpiry] = useState(profile.passportExpiry ?? "");
  const [alertMonths, setAlertMonths] = useState(profile.passportAlertMonths);
  const [countryCode, setCountryCode] = useState("JP");
  const [visaType, setVisaType] = useState("Temporary visitor");
  const [expiryDate, setExpiryDate] = useState("2027-01-01");
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Vault</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Passport expiry and visa stickers feed the alert engine. Numbers are not uploaded anywhere except your database.
        </p>
      </div>
      <form
        className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (readOnly) return;
          start(async () => {
            const result = await saveProfileAction({
              displayName,
              citizenships: [citizenship],
              passportExpiry: passportExpiry || null,
              passportAlertMonths: alertMonths,
            });
            if (!result.ok) toast.error(result.error);
            else toast.success("Passport saved");
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={displayName} disabled={readOnly} onChange={(event) => setDisplayName(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passport-citizenship">Passport</Label>
          <select
            id="passport-citizenship"
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
        <div className="space-y-2">
          <Label htmlFor="expiry">Passport expiry</Label>
          <Input id="expiry" type="date" value={passportExpiry} disabled={readOnly} onChange={(event) => setPassportExpiry(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notice">Alert me this many months out</Label>
          <Input
            id="notice"
            type="number"
            min={1}
            max={24}
            value={alertMonths}
            disabled={readOnly}
            onChange={(event) => setAlertMonths(Number(event.target.value))}
          />
        </div>
        {readOnly ? null : (
          <div className="md:col-span-2">
            <Button type="submit" disabled={pending}>
              Save passport
            </Button>
          </div>
        )}
      </form>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl">Visa stickers</h2>
        {visas.length === 0 ? <p className="text-sm text-muted-foreground">No stickers on file.</p> : null}
        <ul className="space-y-2">
          {visas.map((visa) => (
            <li key={visa.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div>
                <p className="font-medium">
                  {visa.visaType} · {visa.countryCode}
                </p>
                <p className="text-sm text-muted-foreground">Expires {formatDay(visa.expiryDate)}</p>
              </div>
              {readOnly ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    start(async () => {
                      await deleteVisaAction(visa.id);
                    });
                  }}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
        {readOnly ? null : (
          <form
            className="grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              start(async () => {
                const result = await saveVisaAction({
                  id: crypto.randomUUID(),
                  countryCode,
                  visaType,
                  expiryDate,
                  notes,
                });
                if (!result.ok) toast.error(result.error);
                else {
                  toast.success("Visa saved");
                  setNotes("");
                }
              });
            }}
          >
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Country</span>
              <select className="h-10 w-full rounded-xl border border-border bg-background px-3" value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Type</span>
              <Input value={visaType} onChange={(event) => setVisaType(event.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Expiry</span>
              <Input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
            </label>
            <div className="flex items-end">
              <Button type="submit" disabled={pending}>
                Add sticker
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
