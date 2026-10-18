const FRANKFURTER = "https://api.frankfurter.app/latest";
export const FX_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "THB", "MXN", "CAD", "CHF"] as const;
export type FxCode = (typeof FX_CURRENCIES)[number];

const TTL_MS = 6 * 60 * 60 * 1000;

export type FxQuote = {
  base: FxCode;
  date: string;
  rates: Record<string, number>;
  cached: boolean;
  source: "frankfurter";
  fetchedAt: string;
};

type CacheEntry = FxQuote;

const memory = new Map<string, { expires: number; quote: CacheEntry }>();

type Fetcher = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

const responseSchema = {
  parse(value: unknown): { date: string; rates: Record<string, number> } {
    if (!value || typeof value !== "object") throw new Error("Unexpected FX payload");
    const record = value as { date?: unknown; rates?: unknown };
    if (typeof record.date !== "string" || !record.rates || typeof record.rates !== "object") {
      throw new Error("Unexpected FX payload");
    }
    const rates: Record<string, number> = {};
    for (const [code, rate] of Object.entries(record.rates as Record<string, unknown>)) {
      if (typeof rate !== "number" || !Number.isFinite(rate)) throw new Error("Unexpected FX rate");
      rates[code] = rate;
    }
    return { date: record.date, rates };
  },
};

export function isFxCode(value: string): value is FxCode {
  return (FX_CURRENCIES as readonly string[]).includes(value);
}

export async function getFxQuote(
  base: FxCode = "USD",
  options?: { force?: boolean; fetcher?: Fetcher; now?: number },
): Promise<FxQuote> {
  const now = options?.now ?? Date.now();
  const hit = memory.get(base);
  if (!options?.force && hit && hit.expires > now) {
    return { ...hit.quote, cached: true };
  }

  const symbols = FX_CURRENCIES.filter((code) => code !== base).join(",");
  const url = `${FRANKFURTER}?from=${base}&to=${symbols}`;
  const fetcher = options?.fetcher ?? ((input: string) => fetch(input, { cache: "no-store" }));
  const response = await fetcher(url);
  if (!response.ok) throw new Error("Frankfurter request failed");
  const parsed = responseSchema.parse(await response.json());
  const rates = { ...parsed.rates, [base]: 1 };
  const quote: FxQuote = {
    base,
    date: parsed.date,
    rates,
    cached: false,
    source: "frankfurter",
    fetchedAt: new Date(now).toISOString(),
  };
  memory.set(base, { expires: now + TTL_MS, quote });
  return quote;
}

export function convert(quote: FxQuote, amount: number, from: string, to: string): number | null {
  const fromRate = quote.rates[from];
  const toRate = quote.rates[to];
  if (!fromRate || !toRate) return null;
  return (amount / fromRate) * toRate;
}

export function clearFxCache() {
  memory.clear();
}
