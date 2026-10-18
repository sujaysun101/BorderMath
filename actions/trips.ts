"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/store";
import type { Trip } from "@/lib/types";
import { tripSchema, zodError } from "@/lib/validators";

type ActionResult = { ok: true } | { ok: false; error: string };

async function userIdOrError(): Promise<{ userId: string } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in required." };
  return { userId };
}

export async function saveTripAction(input: unknown): Promise<ActionResult> {
  const authResult = await userIdOrError();
  if ("error" in authResult) return { ok: false, error: authResult.error };
  const parsed = tripSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodError(parsed.error) };

  const store = getStore();
  const existing = await store.getTrip(authResult.userId, parsed.data.id);
  const trip: Trip = {
    id: parsed.data.id,
    userId: authResult.userId,
    name: parsed.data.name,
    citizenship: parsed.data.citizenship,
    notes: parsed.data.notes,
    legs: parsed.data.legs.map((leg, index) => ({ ...leg, sortOrder: index })),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  try {
    await store.saveTrip(authResult.userId, trip);
  } catch {
    return { ok: false, error: "The trip could not be saved." };
  }
  revalidatePath("/dashboard");
  revalidatePath("/trips");
  revalidatePath(`/trips/${trip.id}`);
  revalidatePath("/timeline");
  revalidatePath("/alerts");
  return { ok: true };
}

export async function deleteTripAction(id: string): Promise<ActionResult> {
  const authResult = await userIdOrError();
  if ("error" in authResult) return { ok: false, error: authResult.error };
  if (!id || id.length > 80) return { ok: false, error: "Invalid trip." };
  await getStore().deleteTrip(authResult.userId, id);
  revalidatePath("/dashboard");
  revalidatePath("/trips");
  revalidatePath("/timeline");
  revalidatePath("/alerts");
  return { ok: true };
}

export async function loadSampleAction(): Promise<ActionResult> {
  const authResult = await userIdOrError();
  if ("error" in authResult) return { ok: false, error: authResult.error };
  await getStore().loadSample(authResult.userId);
  revalidatePath("/dashboard");
  revalidatePath("/trips");
  return { ok: true };
}
