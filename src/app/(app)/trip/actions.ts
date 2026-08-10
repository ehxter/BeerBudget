"use server";

import { prisma } from "@/lib/prisma";
import { requireTripContext } from "@/lib/trip";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function toggleChecklistItem(id: string, isDone: boolean) {
  const { user } = await requireTripContext();
  await prisma.checklistItem.update({
    where: { id },
    data: {
      isDone,
      completedById: isDone ? user.id : null,
      completedAt: isDone ? new Date() : null,
    },
  });
  revalidatePath("/trip");
}

export type ActionState = { error?: string; ok?: boolean };

export async function addChecklistItem(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { trip } = await requireTripContext();
  const title = formData.get("title")?.toString().trim();
  
  if (!title) return { error: "Title is required" };

  await prisma.checklistItem.create({
    data: {
      tripId: trip.id,
      title,
    },
  });

  revalidatePath("/trip");
  return { ok: true };
}
