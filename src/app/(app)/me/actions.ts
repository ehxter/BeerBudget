"use server";

import { prisma } from "@/lib/prisma";
import { requireTripContext } from "@/lib/trip";
import { revalidatePath } from "next/cache";

import { parseAmountToMinor, type CurrencyCode } from "@/lib/money";

export type ActionState = { error?: string; ok?: boolean };

export async function updateBudget(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { trip, user } = await requireTripContext();
  const amountStr = formData.get("amount")?.toString().trim();
  const currency = formData.get("currency")?.toString() as CurrencyCode;

  if (!amountStr || !currency) return { error: "Amount and currency are required" };

  const amountMinor = parseAmountToMinor(amountStr, currency);
  if (amountMinor === null || amountMinor < 0) return { error: "Invalid amount" };

  await prisma.budget.upsert({
    where: { userId_tripId: { userId: user.id, tripId: trip.id } },
    update: { amountMinor, currency },
    create: { userId: user.id, tripId: trip.id, amountMinor, currency },
  });

  revalidatePath("/me");
  return { ok: true };
}

export async function addPrivateNote(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { user } = await requireTripContext();
  const title = formData.get("title")?.toString().trim();
  const content = formData.get("content")?.toString().trim();

  if (!title || !content) return { error: "Title and content are required" };

  await prisma.privateNote.create({
    data: {
      userId: user.id,
      title,
      content,
    },
  });

  revalidatePath("/me");
  return { ok: true };
}

export async function addVaultItem(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { user } = await requireTripContext();
  const title = formData.get("title")?.toString().trim();
  const category = formData.get("category")?.toString() || "OTHER";
  const content = formData.get("content")?.toString().trim();

  if (!title) return { error: "Title is required" };

  await prisma.privateVaultItem.create({
    data: {
      userId: user.id,
      title,
      category,
      content: content || null,
    },
  });

  revalidatePath("/me");
  return { ok: true };
}
