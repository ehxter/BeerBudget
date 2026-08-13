"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toBase } from "@/lib/convert";
import { CURRENCIES, parseAmountToMinor, type CurrencyCode } from "@/lib/money";

export type ActionState = { error?: string; ok?: boolean };

const schema = z.object({
  amount: z.string().min(1, "Enter an amount"),
  currency: z.enum(CURRENCIES),
});

/**
 * Saves the budget.
 *
 * Whatever currency it is entered in, the figure the app actually burns down
 * is the Lira one — converted here, once, and frozen with the rate used. That
 * keeps a budget set in dollars from drifting up and down each time the market
 * moves, which would make "budget left" mean something different every time
 * you looked at it.
 */
export async function updateBudget(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  const currency = parsed.data.currency as CurrencyCode;
  const amountMinor = parseAmountToMinor(parsed.data.amount, currency);
  if (amountMinor === null || amountMinor < 0) return { error: "Invalid amount" };

  const { baseAmountMinor, rateToBase } = await toBase(amountMinor, currency);

  await prisma.budget.upsert({
    where: { userId: user.id },
    update: { amountMinor, currency, baseAmountMinor, rateToBase },
    create: { userId: user.id, amountMinor, currency, baseAmountMinor, rateToBase },
  });

  revalidatePath("/me");
  revalidatePath("/");
  return { ok: true };
}
