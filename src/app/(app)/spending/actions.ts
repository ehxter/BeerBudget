"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTripContextOrNull } from "@/lib/trip";
import { createExpense } from "@/lib/expenses";
import { CURRENCIES, parseAmountToMinor, parseDecimal, type CurrencyCode } from "@/lib/money";
import { EXPENSE_CATEGORIES, SPLIT_METHODS, valuesOf } from "@/lib/constants";
import { fromDateInputValue } from "@/lib/format";

export type ExpenseFormState = { error?: string; ok?: boolean };

const schema = z.object({
  amount: z.string().min(1, "Enter an amount"),
  currency: z.enum(CURRENCIES),
  description: z.string().trim().min(1, "Add a short description").max(120),
  category: z.enum(valuesOf(EXPENSE_CATEGORIES)),
  splitMethod: z.enum(valuesOf(SPLIT_METHODS)),
  scope: z.enum(["SHARED", "PRIVATE"]),
  paidById: z.string().optional(),
  beneficiaryId: z.string().optional(),
  customSelf: z.string().optional(),
  customPartner: z.string().optional(),
  date: z.string().optional(),
  note: z.string().trim().max(500).optional(),
  rate: z.string().optional(),
});

function revalidateMoneyScreens() {
  revalidatePath("/");
  revalidatePath("/spending");
  revalidatePath("/settlement");
  revalidatePath("/me");
}

export async function addExpense(
  _previous: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const ctx = await getTripContextOrNull();
  if (!ctx) return { error: "Your session expired. Sign in again." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  const input = parsed.data;
  const currency = input.currency as CurrencyCode;

  const amountMinor = parseAmountToMinor(input.amount, currency);
  if (amountMinor === null || amountMinor <= 0) {
    return { error: "Enter an amount greater than zero" };
  }

  const { trip, user, partner } = ctx;
  const isShared = input.scope === "SHARED" && partner !== null;

  // The payer must be one of the two travelers — never trust the posted id.
  const memberIds = partner ? [user.id, partner.id] : [user.id];
  const paidById =
    input.paidById && memberIds.includes(input.paidById) ? input.paidById : user.id;

  const beneficiaryId =
    input.beneficiaryId && memberIds.includes(input.beneficiaryId)
      ? input.beneficiaryId
      : user.id;

  let customShares: Record<string, number> | undefined;
  if (isShared && input.splitMethod === "CUSTOM") {
    const selfShare = parseAmountToMinor(input.customSelf ?? "0", currency) ?? 0;
    const partnerShare = parseAmountToMinor(input.customPartner ?? "0", currency) ?? 0;

    if (selfShare + partnerShare !== amountMinor) {
      return { error: "The two shares must add up to the total" };
    }
    customShares = { [user.id]: selfShare };
    if (partner) customShares[partner.id] = partnerShare;
  }

  const spentAt = input.date ? (fromDateInputValue(input.date) ?? new Date()) : new Date();
  // Keep the current time when the date is today, so the activity feed orders
  // sensibly; backdated expenses land at midday.
  const now = new Date();
  if (
    spentAt.getFullYear() === now.getFullYear() &&
    spentAt.getMonth() === now.getMonth() &&
    spentAt.getDate() === now.getDate()
  ) {
    spentAt.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
  } else {
    spentAt.setHours(12, 0, 0, 0);
  }

  const rateOverride = input.rate ? (parseDecimal(input.rate) ?? undefined) : undefined;

  try {
    await createExpense({
      tripId: trip.id,
      baseCurrency: trip.baseCurrency,
      actorId: user.id,
      paidById,
      amountMinor,
      currency,
      description: input.description,
      category: input.category,
      spentAt,
      isShared,
      splitMethod: input.splitMethod as never,
      memberIds,
      beneficiaryId,
      customShares,
      note: input.note,
      rateOverride,
    });
  } catch (error) {
    console.error("[expense] create failed:", error);
    return { error: "Could not save the expense. Try again." };
  }

  revalidateMoneyScreens();
  return { ok: true };
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const ctx = await getTripContextOrNull();
  if (!ctx) return;

  const id = formData.get("id");
  if (typeof id !== "string") return;

  const expense = await prisma.expense.findUnique({
    where: { id },
    select: { id: true, tripId: true, isShared: true, paidById: true },
  });

  // Must belong to this trip, and a private expense may only be removed by the
  // person it belongs to.
  if (!expense || expense.tripId !== ctx.trip.id) return;
  if (!expense.isShared && expense.paidById !== ctx.user.id) return;

  await prisma.expense.delete({ where: { id: expense.id } });
  revalidateMoneyScreens();
}
