"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toBase } from "@/lib/convert";
import { CURRENCIES, parseAmountToMinor, type CurrencyCode } from "@/lib/money";
import { EXPENSE_CATEGORIES, valuesOf } from "@/lib/constants";
import { fromDateInputValue } from "@/lib/format";

export type ExpenseFormState = { error?: string; ok?: boolean };

const schema = z.object({
  amount: z.string().min(1, "Enter an amount"),
  currency: z.enum(CURRENCIES),
  description: z.string().trim().min(1, "Add a short description").max(120),
  category: z.enum(valuesOf(EXPENSE_CATEGORIES)),
  date: z.string().optional(),
  note: z.string().trim().max(500).optional(),
});

function revalidateMoneyScreens() {
  revalidatePath("/");
  revalidatePath("/spending");
  revalidatePath("/me");
}

export async function addExpense(
  _previous: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

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

  const spentAt = input.date ? (fromDateInputValue(input.date) ?? new Date()) : new Date();
  // Keep the current time when the date is today, so the feed orders
  // sensibly; backdated costs land at midday.
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

  try {
    // What was actually paid is kept as entered; the Lira equivalent is frozen
    // alongside it so every screen can add costs up without a conversion.
    const { baseAmountMinor, rateToBase } = await toBase(amountMinor, currency);

    await prisma.expense.create({
      data: {
        userId: user.id,
        description: input.description,
        category: input.category,
        amountMinor,
        currency,
        baseAmountMinor,
        rateToBase,
        spentAt,
        note: input.note || null,
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("[expense] create failed:", error);
    return { error: "Could not save the cost. Try again." };
  }

  revalidateMoneyScreens();
  return { ok: true };
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const id = formData.get("id");
  if (typeof id !== "string") return;

  // deleteMany with the owner in the `where`: someone else's id matches zero
  // rows and quietly does nothing, which is the right outcome for "not yours".
  await prisma.expense.deleteMany({ where: { id, userId: user.id } });
  revalidateMoneyScreens();
}
