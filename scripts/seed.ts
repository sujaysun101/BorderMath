import { cloneDemoFor, DEMO_USER_ID } from "@/lib/demo-data";
import { getStore } from "@/lib/store";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log(
      "DATABASE_URL is not set. Memory mode already serves the demo nomad year for the demo user. Nothing was written.",
    );
    return;
  }
  const userId = process.env.SEED_USER_ID || DEMO_USER_ID;
  const store = getStore();
  const existing = await store.listTrips(userId);
  if (existing.length > 0) {
    console.log(`User ${userId} already has ${existing.length} trip(s). Seed skipped.`);
    return;
  }
  const cloned = cloneDemoFor(userId);
  if (userId === DEMO_USER_ID) {
    const { demoProfile, demoTrips } = await import("@/lib/demo-data");
    await store.saveProfile(userId, demoProfile);
    for (const trip of demoTrips) await store.saveTrip(userId, trip);
  } else {
    await store.saveProfile(userId, cloned.profile);
    for (const trip of cloned.trips) await store.saveTrip(userId, trip);
  }
  console.log(`Seeded demo trips for ${userId}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed failed");
  process.exit(1);
});
