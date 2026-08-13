"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toBase } from "@/lib/convert";
import { CURRENCIES, parseAmountToMinor, type CurrencyCode } from "@/lib/money";
import { DEBT_DIRECTIONS, valuesOf } from "@/lib/constants";
import { fromDateInputValue } from "@/lib/format";

export type DebtFormState = { error?: string; ok?: boolean };

const schema = z.object({
  direction: z.enum(valuesOf(DEBT_DIRECTIONS)),
  amount: z.string().min(1, "Enter an amount"),
  currency: z.enum(CURRENCIES),
  description: z.string().trim().max(120).optional(),
  date: z.string().optional(),
});

/**
 * A debt moves the budget, so Home refreshes with the ledger — and the ledger
 * itself is rendered in two places: its own screen, and the Settlement tab on
 * Spending.
 */
function revalidateDebtScreens() {
  revalidatePath("/");
  revalidatePath("/settlement");
  revalidatePath("/spending");
}

export async function addDebt(
  _previous: DebtFormState,
  formData: FormData,
): Promise<DebtFormState> {
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

  const occurredAt = input.date
    ? (fromDateInputValue(input.date) ?? new Date())
    : new Date();

  try {
    const { baseAmountMinor, rateToBase } = await toBase(amountMinor, currency);

    await prisma.debt.create({
      data: {
        userId: user.id,
        direction: input.direction,
        amountMinor,
        currency,
        baseAmountMinor,
        rateToBase,
        description: input.description || null,
        occurredAt,
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("[debt] create failed:", error);
    return { error: "Could not save that. Try again." };
  }

  revalidateDebtScreens();
  return { ok: true };
}

/**
 * Marks a debt paid, or puts it back. Settled rows stay in the ledger for the
 * record but stop counting toward the balance and the budget.
 *
 * updateMany rather than update: with the owner in the `where`, someone else's
 * id matches zero rows and quietly does nothing.
 */
export async function setDebtSettled(id: string, settled: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.debt.updateMany({
    where: { id, userId: user.id },
    data: { settledAt: settled ? new Date() : null },
  });

  revalidateDebtScreens();
}

export async function deleteDebt(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.debt.deleteMany({ where: { id, userId: user.id } });
  revalidateDebtScreens();
}
