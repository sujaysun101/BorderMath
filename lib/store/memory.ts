import { cloneDemoFor, DEMO_USER_ID, demoProfile, demoTrips } from "@/lib/demo-data";
import type { Profile, Trip, VisaDoc } from "@/lib/types";
import type { Store } from "@/lib/store/types";

type Bucket = {
  profile: Profile;
  trips: Trip[];
  visas: VisaDoc[];
};

const globalStore = globalThis as unknown as { bordermathMemory?: Map<string, Bucket> };

function buckets() {
  if (!globalStore.bordermathMemory) globalStore.bordermathMemory = new Map();
  return globalStore.bordermathMemory;
}

function blankProfile(userId: string): Profile {
  return {
    userId,
    displayName: "",
    citizenships: ["US"],
    passportExpiry: null,
    passportAlertMonths: 6,
  };
}

function ensure(userId: string): Bucket {
  const map = buckets();
  const existing = map.get(userId);
  if (existing) return existing;
  if (userId === DEMO_USER_ID) {
    const seeded: Bucket = {
      profile: { ...demoProfile, citizenships: [...demoProfile.citizenships] },
      trips: structuredClone(demoTrips),
      visas: [],
    };
    map.set(userId, seeded);
    return seeded;
  }
  const cloned = cloneDemoFor(userId);
  const seeded: Bucket = { profile: cloned.profile, trips: cloned.trips, visas: cloned.visas };
  map.set(userId, seeded);
  return seeded;
}

export function createMemoryStore(): Store {
  return {
    mode: "memory",
    async listTrips(userId) {
      return ensure(userId).trips.map((trip) => ({ ...trip, legs: trip.legs.map((leg) => ({ ...leg })) }));
    },
    async getTrip(userId, id) {
      const trip = ensure(userId).trips.find((item) => item.id === id);
      return trip ? { ...trip, legs: trip.legs.map((leg) => ({ ...leg })) } : null;
    },
    async saveTrip(userId, trip) {
      const bucket = ensure(userId);
      const next = { ...trip, userId, legs: [...trip.legs].sort((a, b) => a.sortOrder - b.sortOrder) };
      const index = bucket.trips.findIndex((item) => item.id === trip.id);
      if (index >= 0) bucket.trips[index] = next;
      else bucket.trips.unshift(next);
      return next;
    },
    async deleteTrip(userId, id) {
      const bucket = ensure(userId);
      bucket.trips = bucket.trips.filter((trip) => trip.id !== id);
    },
    async getProfile(userId) {
      return { ...ensure(userId).profile, citizenships: [...ensure(userId).profile.citizenships] };
    },
    async saveProfile(userId, profile) {
      const bucket = ensure(userId);
      bucket.profile = { ...profile, userId, citizenships: [...profile.citizenships] };
      return bucket.profile;
    },
    async listVisas(userId) {
      return ensure(userId).visas.map((visa) => ({ ...visa }));
    },
    async saveVisa(userId, visa) {
      const bucket = ensure(userId);
      const next = { ...visa, userId };
      const index = bucket.visas.findIndex((item) => item.id === visa.id);
      if (index >= 0) bucket.visas[index] = next;
      else bucket.visas.unshift(next);
      return next;
    },
    async deleteVisa(userId, id) {
      const bucket = ensure(userId);
      bucket.visas = bucket.visas.filter((visa) => visa.id !== id);
    },
    async loadSample(userId) {
      const bucket = ensure(userId);
      if (bucket.trips.length > 0) return;
      const cloned = cloneDemoFor(userId);
      bucket.profile = cloned.profile;
      bucket.trips = cloned.trips;
      bucket.visas = cloned.visas;
    },
  };
}

export function emptyProfile(userId: string): Profile {
  return blankProfile(userId);
}
