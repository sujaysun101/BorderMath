"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/store";
import { profileSchema, visaSchema, zodError } from "@/lib/validators";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser(): Promise<{ userId: string } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in required." };
  return { userId };
}

export async function saveProfileAction(input: unknown): Promise<ActionResult> {
  const authResult = await requireUser();
  if ("error" in authResult) return { ok: false, error: authResult.error };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodError(parsed.error) };
  await getStore().saveProfile(authResult.userId, { userId: authResult.userId, ...parsed.data });
  revalidatePath("/vault");
  revalidatePath("/dashboard");
  revalidatePath("/alerts");
  return { ok: true };
}

export async function saveVisaAction(input: unknown): Promise<ActionResult> {
  const authResult = await requireUser();
  if ("error" in authResult) return { ok: false, error: authResult.error };
  const parsed = visaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodError(parsed.error) };
  await getStore().saveVisa(authResult.userId, { userId: authResult.userId, ...parsed.data });
  revalidatePath("/vault");
  revalidatePath("/alerts");
  return { ok: true };
}

export async function deleteVisaAction(id: string): Promise<ActionResult> {
  const authResult = await requireUser();
  if ("error" in authResult) return { ok: false, error: authResult.error };
  if (!id || id.length > 80) return { ok: false, error: "Invalid visa." };
  await getStore().deleteVisa(authResult.userId, id);
  revalidatePath("/vault");
  revalidatePath("/alerts");
  return { ok: true };
}
