"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FX_CURRENCIES, convert, type FxQuote } from "@/lib/fx";

export function FxPanel({ quote, error, basePath = "" }: { quote: FxQuote | null; error: string | null; basePath?: string }) {
  const [amount, setAmount] = useState(1000);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("THB");
  const value = useMemo(() => (quote ? convert(quote, amount, from, to) : null), [quote, amount, from, to]);

  return (
    <div className="space-y-6" data-testid="fx-panel">
      <div>
        <h1 className="font-serif text-4xl">Currency</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Rates come from the European Central Bank via Frankfurter. No API key. Responses are cached for six hours.
          {quote ? ` Reference date ${quote.date}${quote.cached ? ", served from cache" : ""}.` : ""}
        </p>
      </div>
      {error ? <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</p> : null}
      <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" min={0} value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
        </div>
        <CurrencyField id="from" label="From" value={from} onChange={setFrom} />
        <CurrencyField id="to" label="To" value={to} onChange={setTo} />
        <div className="space-y-2">
          <Label>Result</Label>
          <p className="font-serif text-3xl">{value === null ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground">{to}</p>
        </div>
      </div>
      {quote ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(quote.rates)
            .filter(([code]) => code !== quote.base)
            .map(([code, rate]) => (
              <div key={code} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">1 {quote.base}</p>
                <p className="font-serif text-2xl">
                  {rate.toLocaleString("en-US", { maximumFractionDigits: 3 })} {code}
                </p>
              </div>
            ))}
        </div>
      ) : null}
      <form action={`${basePath}/fx`} method="get">
        <Button type="submit" variant="outline" name="refresh" value="1">
          Refresh rates
        </Button>
      </form>
    </div>
  );
}

function CurrencyField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {FX_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </div>
  );
}
