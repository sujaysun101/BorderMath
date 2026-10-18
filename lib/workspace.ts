import { buildAlerts, daysByCountry, personSchengen } from "@/lib/compliance";
import { getFxQuote, type FxQuote } from "@/lib/fx";
import { getStore } from "@/lib/store";
import type { Profile, StoreMode, Trip, VisaDoc } from "@/lib/types";
import type { Alert } from "@/lib/compliance";
import type { RollingResult } from "@/lib/schengen";

export type Workspace = {
  mode: StoreMode;
  trips: Trip[];
  profile: Profile;
  visas: VisaDoc[];
  alerts: Alert[];
  schengen: RollingResult;
  countries: ReturnType<typeof daysByCountry>;
  fx: FxQuote | null;
  fxError: string | null;
};

export async function loadWorkspace(userId: string, options?: { forceMemory?: boolean }): Promise<Workspace> {
  const store = getStore(options);
  const [trips, profile, visas] = await Promise.all([
    store.listTrips(userId),
    store.getProfile(userId),
    store.listVisas(userId),
  ]);
  let fx: FxQuote | null = null;
  let fxError: string | null = null;
  try {
    fx = await getFxQuote("USD");
  } catch {
    fxError = "Frankfurter is unreachable right now. No made-up rates are shown.";
  }
  return {
    mode: store.mode,
    trips,
    profile,
    visas,
    alerts: buildAlerts(trips, profile, visas),
    schengen: personSchengen(trips),
    countries: daysByCountry(trips),
    fx,
    fxError,
  };
}
