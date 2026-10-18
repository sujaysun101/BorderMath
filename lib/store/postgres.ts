import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { profiles, tripLegs, trips, visaDocuments } from "@/lib/db/schema";
import { cloneDemoFor } from "@/lib/demo-data";
import type { Profile, Transport, Trip, VisaDoc } from "@/lib/types";
import { emptyProfile } from "@/lib/store/memory";
import type { Store } from "@/lib/store/types";

function toTrip(
  row: typeof trips.$inferSelect,
  legs: Array<typeof tripLegs.$inferSelect>,
): Trip {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    citizenship: row.citizenship,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    legs: legs
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((leg) => ({
        id: leg.id,
        countryCode: leg.countryCode,
        entryDate: leg.entryDate,
        exitDate: leg.exitDate,
        transport: leg.transport as Transport,
        sortOrder: leg.sortOrder,
      })),
  };
}

function toProfile(row: typeof profiles.$inferSelect): Profile {
  let citizenships = ["US"];
  try {
    const parsed = JSON.parse(row.citizenships) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) citizenships = parsed;
  } catch {
    citizenships = ["US"];
  }
  return {
    userId: row.userId,
    displayName: row.displayName,
    citizenships,
    passportExpiry: row.passportExpiry,
    passportAlertMonths: row.passportAlertMonths,
  };
}

export function createPostgresStore(): Store {
  return {
    mode: "postgres",
    async listTrips(userId) {
      const db = getDb();
      const rows = await db.select().from(trips).where(eq(trips.userId, userId));
      const allLegs = (
        await Promise.all(rows.map((row) => db.select().from(tripLegs).where(eq(tripLegs.tripId, row.id))))
      ).flat();
      return rows
        .map((row) => toTrip(row, allLegs.filter((leg) => leg.tripId === row.id)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async getTrip(userId, id) {
      const db = getDb();
      const rows = await db
        .select()
        .from(trips)
        .where(and(eq(trips.id, id), eq(trips.userId, userId)));
      const row = rows[0];
      if (!row) return null;
      const legs = await db.select().from(tripLegs).where(eq(tripLegs.tripId, id)).orderBy(asc(tripLegs.sortOrder));
      return toTrip(row, legs);
    },
    async saveTrip(userId, trip) {
      const db = getDb();
      const owned = await db
        .select({ id: trips.id })
        .from(trips)
        .where(and(eq(trips.id, trip.id), eq(trips.userId, userId)));
      await db.transaction(async (tx) => {
        if (owned.length === 0) {
          await tx.insert(trips).values({
            id: trip.id,
            userId,
            name: trip.name,
            citizenship: trip.citizenship,
            notes: trip.notes,
            createdAt: new Date(trip.createdAt),
          });
        } else {
          await tx
            .update(trips)
            .set({ name: trip.name, citizenship: trip.citizenship, notes: trip.notes })
            .where(and(eq(trips.id, trip.id), eq(trips.userId, userId)));
        }
        await tx.delete(tripLegs).where(eq(tripLegs.tripId, trip.id));
        if (trip.legs.length > 0) {
          await tx.insert(tripLegs).values(
            trip.legs.map((leg) => ({
              id: leg.id,
              tripId: trip.id,
              countryCode: leg.countryCode,
              entryDate: leg.entryDate,
              exitDate: leg.exitDate,
              transport: leg.transport,
              sortOrder: leg.sortOrder,
            })),
          );
        }
      });
      return { ...trip, userId };
    },
    async deleteTrip(userId, id) {
      const db = getDb();
      await db.delete(trips).where(and(eq(trips.id, id), eq(trips.userId, userId)));
    },
    async getProfile(userId) {
      const db = getDb();
      const rows = await db.select().from(profiles).where(eq(profiles.userId, userId));
      return rows[0] ? toProfile(rows[0]) : emptyProfile(userId);
    },
    async saveProfile(userId, profile) {
      const db = getDb();
      const values = {
        userId,
        displayName: profile.displayName,
        citizenships: JSON.stringify(profile.citizenships),
        passportExpiry: profile.passportExpiry,
        passportAlertMonths: profile.passportAlertMonths,
        updatedAt: new Date(),
      };
      await db
        .insert(profiles)
        .values(values)
        .onConflictDoUpdate({
          target: profiles.userId,
          set: {
            displayName: values.displayName,
            citizenships: values.citizenships,
            passportExpiry: values.passportExpiry,
            passportAlertMonths: values.passportAlertMonths,
            updatedAt: values.updatedAt,
          },
        });
      return { ...profile, userId };
    },
    async listVisas(userId) {
      const db = getDb();
      const rows = await db.select().from(visaDocuments).where(eq(visaDocuments.userId, userId));
      return rows.map(
        (row): VisaDoc => ({
          id: row.id,
          userId: row.userId,
          countryCode: row.countryCode,
          visaType: row.visaType,
          expiryDate: row.expiryDate,
          notes: row.notes,
        }),
      );
    },
    async saveVisa(userId, visa) {
      const db = getDb();
      await db
        .insert(visaDocuments)
        .values({
          id: visa.id,
          userId,
          countryCode: visa.countryCode,
          visaType: visa.visaType,
          expiryDate: visa.expiryDate,
          notes: visa.notes,
        })
        .onConflictDoUpdate({
          target: visaDocuments.id,
          set: {
            countryCode: visa.countryCode,
            visaType: visa.visaType,
            expiryDate: visa.expiryDate,
            notes: visa.notes,
          },
        });
      return { ...visa, userId };
    },
    async deleteVisa(userId, id) {
      const db = getDb();
      await db.delete(visaDocuments).where(and(eq(visaDocuments.id, id), eq(visaDocuments.userId, userId)));
    },
    async loadSample(userId) {
      const existing = await this.listTrips(userId);
      if (existing.length > 0) return;
      const cloned = cloneDemoFor(userId);
      await this.saveProfile(userId, cloned.profile);
      for (const trip of cloned.trips) await this.saveTrip(userId, trip);
    },
  };
}
