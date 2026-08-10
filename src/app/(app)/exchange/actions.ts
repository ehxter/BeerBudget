"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTripContext } from "@/lib/trip";
import { parseAmountToMinor, CURRENCIES } from "@/lib/money";
import { revalidatePath } from "next/cache";

export type ExchangeFormState = {
  error?: string;
  ok?: boolean;
};

const exchangeSchema = z.object({
  fromAmount: z.string().min(1, "Amount is required"),
  fromCurrency: z.enum(CURRENCIES),
  toAmount: z.string().min(1, "Received amount is required"),
  toCurrency: z.enum(CURRENCIES),
  location: z.string().optional(),
  note: z.string().optional(),
});

export async function addExchange(
  prevState: ExchangeFormState,
  formData: FormData,
): Promise<ExchangeFormState> {
  const { trip, user } = await requireTripContext();

  const parsed = exchangeSchema.safeParse({
    fromAmount: formData.get("fromAmount"),
    fromCurrency: formData.get("fromCurrency"),
    toAmount: formData.get("toAmount"),
    toCurrency: formData.get("toCurrency"),
    location: formData.get("location"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { error: "Check your inputs and try again." };
  }

  const { fromAmount, fromCurrency, toAmount, toCurrency, location, note } = parsed.data;

  const fromAmountMinor = parseAmountToMinor(fromAmount, fromCurrency);
  const toAmountMinor = parseAmountToMinor(toAmount, toCurrency);

  if (!fromAmountMinor || fromAmountMinor <= 0) {
    return { error: "Please enter a valid amount." };
  }
  if (!toAmountMinor || toAmountMinor <= 0) {
    return { error: "Please enter a valid received amount." };
  }
  if (fromCurrency === toCurrency) {
    return { error: "Currencies must be different." };
  }

  const fromStandard = fromAmountMinor / (fromCurrency === "TOMAN" ? 1 : 100);
  const toStandard = toAmountMinor / (toCurrency === "TOMAN" ? 1 : 100);
  const effectiveRate = toStandard / fromStandard;

  try {
    await prisma.exchangeTransaction.create({
      data: {
        tripId: trip.id,
        userId: user.id,
        fromCurrency,
        toCurrency,
        fromAmountMinor,
        toAmountMinor,
        effectiveRate,
        location: location || null,
        note: note || null,
        occurredAt: new Date(),
      },
    });

    revalidatePath("/exchange");
    revalidatePath("/spending");
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to save exchange transaction." };
  }
}
