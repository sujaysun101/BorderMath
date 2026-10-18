import type { Profile, Trip, VisaDoc } from "@/lib/types";

export const DEMO_USER_ID = "demo-user";

export const demoProfile: Profile = {
  userId: DEMO_USER_ID,
  displayName: "Maya Chen",
  citizenships: ["US"],
  passportExpiry: "2027-04-15",
  passportAlertMonths: 6,
};

export const demoTrips: Trip[] = [
  {
    id: "trip-spring",
    userId: DEMO_USER_ID,
    name: "Spring circuit",
    citizenship: "US",
    notes: "Lisbon, Madrid, a UK reset, then Lyon. Aimed at the Schengen buffer, not the legal cap.",
    createdAt: "2025-11-02T00:00:00.000Z",
    legs: [
      {
        id: "leg-pt",
        countryCode: "PT",
        entryDate: "2026-01-05",
        exitDate: "2026-02-17",
        transport: "air",
        sortOrder: 0,
      },
      {
        id: "leg-es",
        countryCode: "ES",
        entryDate: "2026-02-18",
        exitDate: "2026-03-14",
        transport: "air",
        sortOrder: 1,
      },
      {
        id: "leg-gb",
        countryCode: "GB",
        entryDate: "2026-03-15",
        exitDate: "2026-04-10",
        transport: "air",
        sortOrder: 2,
      },
      {
        id: "leg-fr",
        countryCode: "FR",
        entryDate: "2026-04-11",
        exitDate: "2026-04-30",
        transport: "land",
        sortOrder: 3,
      },
    ],
  },
  {
    id: "trip-monsoon",
    userId: DEMO_USER_ID,
    name: "Monsoon desk",
    citizenship: "US",
    notes: "Thailand at the new 30-day exemption, then Dubai and Tokyo.",
    createdAt: "2025-12-14T00:00:00.000Z",
    legs: [
      {
        id: "leg-th",
        countryCode: "TH",
        entryDate: "2026-05-06",
        exitDate: "2026-06-04",
        transport: "air",
        sortOrder: 0,
      },
      {
        id: "leg-ae",
        countryCode: "AE",
        entryDate: "2026-06-08",
        exitDate: "2026-07-07",
        transport: "air",
        sortOrder: 1,
      },
      {
        id: "leg-jp",
        countryCode: "JP",
        entryDate: "2026-07-10",
        exitDate: "2026-08-08",
        transport: "air",
        sortOrder: 2,
      },
    ],
  },
  {
    id: "trip-draft",
    userId: DEMO_USER_ID,
    name: "Draft: do not fly",
    citizenship: "US",
    notes: "A rejected draft. Italy breaks 90/180 and the December Bangkok leg breaks the 30-day exemption.",
    createdAt: "2026-06-01T00:00:00.000Z",
    legs: [
      {
        id: "leg-it",
        countryCode: "IT",
        entryDate: "2026-09-01",
        exitDate: "2026-11-30",
        transport: "air",
        sortOrder: 0,
      },
      {
        id: "leg-th-2",
        countryCode: "TH",
        entryDate: "2026-12-01",
        exitDate: "2026-12-31",
        transport: "air",
        sortOrder: 1,
      },
    ],
  },
];

export const demoVisas: VisaDoc[] = [];

export function cloneDemoFor(userId: string): { profile: Profile; trips: Trip[]; visas: VisaDoc[] } {
  return {
    profile: { ...demoProfile, userId, citizenships: [...demoProfile.citizenships] },
    trips: demoTrips.map((trip) => ({
      ...trip,
      id: `${userId}-${trip.id}`,
      userId,
      legs: trip.legs.map((leg) => ({ ...leg, id: `${userId}-${leg.id}` })),
    })),
    visas: [],
  };
}
