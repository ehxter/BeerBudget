"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteStored } from "@/lib/vault";

export type ActionState = { error?: string; ok?: boolean };

/**
 * Everything in the Vault is private to its owner, so every write below is
 * scoped to `userId` and never trusts a bare id from the client.
 */
export async function addChecklistItem(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const title = formData.get("title")?.toString().trim();
  if (!title) return { error: "Title is required" };

  await prisma.checklistItem.create({
    data: { userId: user.id, title: title.slice(0, 120) },
  });

  revalidatePath("/vault");
  return { ok: true };
}

export async function toggleChecklistItem(id: string, isDone: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  // updateMany rather than update: with a `where` that includes userId, a
  // mismatched owner matches zero rows and silently no-ops instead of
  // throwing — the safe outcome for "not yours" is doing nothing.
  await prisma.checklistItem.updateMany({
    where: { id, userId: user.id },
    data: { isDone },
  });
  revalidatePath("/vault");
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.checklistItem.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/vault");
}

const MAX_NOTE = 5000;

/**
 * Notes have no title on purpose, so the body is the whole thing — an empty
 * one would be a row with nothing in it.
 */
export async function addNote(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const body = formData.get("body")?.toString().trim();
  if (!body) return { error: "Write something first" };

  await prisma.note.create({
    data: { userId: user.id, body: body.slice(0, MAX_NOTE) },
  });

  revalidatePath("/vault");
  return { ok: true };
}

export async function updateNote(id: string, body: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const trimmed = body.trim();
  // An edit that empties a note is a mistake, not a delete — deleting is its
  // own control, with its own confirmation.
  if (!trimmed) return;

  await prisma.note.updateMany({
    where: { id, userId: user.id },
    data: { body: trimmed.slice(0, MAX_NOTE) },
  });

  revalidatePath("/vault");
}

export async function deleteNote(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.note.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/vault");
}

/**
 * Removes a file's row and its bytes.
 *
 * The row goes first: a row with no file behind it is a broken link, while a
 * file with no row is unreachable and invisible, so if only one of the two can
 * happen, it should be the second.
 */
export async function deleteVaultFile(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const file = await prisma.vaultFile.findFirst({
    where: { id, userId: user.id },
    select: { id: true, storedName: true },
  });
  if (!file) return;

  await prisma.vaultFile.delete({ where: { id: file.id } });
  await deleteStored(file.storedName);

  revalidatePath("/vault");
}
