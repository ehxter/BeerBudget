import "server-only";

import { prisma } from "@/lib/prisma";
import {
  convertMinor,
  splitEqualMinor,
  type CurrencyCode,
} from "@/lib/money";
import { getRateTable, rateFromTable } from "@/lib/rates/store";
import type { SplitMethod } from "@/lib/constants";

/**
 * Turns a split method plus a set of people into per-person shares that sum to
 * exactly the expense total — no lost or invented minor units.
 */
export function resolveShares({
  totalMinor,
  splitMethod,
  memberIds,
  payerId,
  beneficiaryId,
  customShares,
}: {
  totalMinor: number;
  splitMethod: SplitMethod;
  memberIds: string[];
  payerId: string;
  /** For SINGLE: the one person the expense belongs to. */
  beneficiaryId?: string;
  /** For CUSTOM: explicit per-user amounts in the expense currency. */
  customShares?: Record<string, number>;
}): { userId: string; shareMinor: number }[] {
  if (splitMethod === "SINGLE") {
    const owner = beneficiaryId ?? payerId;
    return [{ userId: owner, shareMinor: totalMinor }];
  }

  if (splitMethod === "CUSTOM") {
    const entries = memberIds
      .map((userId) => ({ userId, shareMinor: customShares?.[userId] ?? 0 }))
      .filter((entry) => entry.shareMinor > 0);

    if (entries.length === 0) {
      return [{ userId: payerId, shareMinor: totalMinor }];
    }

    // Absorb any rounding gap into the largest share so the parts still add up.
    const sum = entries.reduce((total, entry) => total + entry.shareMinor, 0);
    const drift = totalMinor - sum;
    if (drift !== 0) {
      let largest = 0;
      for (let i = 1; i < entries.length; i += 1) {
        if (entries[i].shareMinor > entries[largest].shareMinor) largest = i;
      }
      entries[largest].shareMinor += drift;
    }

    return entries;
  }

  // EQUAL
  const parts = splitEqualMinor(totalMinor, memberIds.length);
  return memberIds.map((userId, index) => ({
    userId,
    shareMinor: parts[index] ?? 0,
  }));
}

/**
 * Converts each share into the trip's base currency such that the converted
 * shares sum to exactly the converted total. Converting each share
 * independently would drift by a minor unit or two and slowly corrupt the
 * settlement balance.
 */
export function toBaseShares(
  shares: { userId: string; shareMinor: number }[],
  baseAmountMinor: number,
  currency: CurrencyCode,
  baseCurrency: CurrencyCode,
  rateToBase: number,
): { userId: string; shareMinor: number; baseShareMinor: number }[] {
  if (shares.length === 0) return [];

  const converted = shares.map((share) => ({
    ...share,
    baseShareMinor: convertMinor(share.shareMinor, currency, baseCurrency, rateToBase),
  }));

  const sum = converted.reduce((total, share) => total + share.baseShareMinor, 0);
  const drift = baseAmountMinor - sum;

  if (drift !== 0) {
    let largest = 0;
    for (let i = 1; i < converted.length; i += 1) {
      if (converted[i].baseShareMinor > converted[largest].baseShareMinor) largest = i;
    }
    converted[largest].baseShareMinor += drift;
  }

  return converted;
}

export type CreateExpenseInput = {
  tripId: string;
  baseCurrency: CurrencyCode;
  /** Always the session user — never taken from the client payload. */
  actorId: string;
  paidById: string;
  amountMinor: number;
  currency: CurrencyCode;
  description: string;
  category: string;
  spentAt: Date;
  isShared: boolean;
  splitMethod: SplitMethod;
  memberIds: string[];
  beneficiaryId?: string;
  customShares?: Record<string, number>;
  note?: string;
  /**
   * Rate to use instead of the current reference rate — e.g. the effective
   * rate from a real exchange the traveler made.
   */
  rateOverride?: number;
};

/**
 * Records an expense and its participant shares in one transaction.
 *
 * The conversion rate is frozen onto the row at write time, so a later move in
 * the exchange rate never retroactively changes what someone owes.
 */
export async function createExpense(input: CreateExpenseInput) {
  const {
    tripId,
    baseCurrency,
    actorId,
    paidById,
    amountMinor,
    currency,
    description,
    category,
    spentAt,
    splitMethod,
    memberIds,
    beneficiaryId,
    customShares,
    note,
    rateOverride,
  } = input;

  // A private expense is always paid by, and owed entirely by, its owner.
  const isShared = input.isShared;
  const effectivePayer = isShared ? paidById : actorId;

  let rateToBase = rateOverride;
  if (!rateToBase || !Number.isFinite(rateToBase) || rateToBase <= 0) {
    const table = await getRateTable();
    rateToBase = rateFromTable(table, currency, baseCurrency);
  }
  if (!Number.isFinite(rateToBase) || rateToBase <= 0) rateToBase = 1;

  const baseAmountMinor = convertMinor(amountMinor, currency, baseCurrency, rateToBase);

  const rawShares = isShared
    ? resolveShares({
        totalMinor: amountMinor,
        splitMethod,
        memberIds,
        payerId: effectivePayer,
        beneficiaryId,
        customShares,
      })
    : [{ userId: actorId, shareMinor: amountMinor }];

  const shares = toBaseShares(
    rawShares,
    baseAmountMinor,
    currency,
    baseCurrency,
    rateToBase,
  );

  return prisma.expense.create({
    data: {
      tripId,
      paidById: effectivePayer,
      description,
      category,
      amountMinor,
      currency,
      baseAmountMinor,
      rateToBase,
      spentAt,
      isShared,
      splitMethod: isShared ? splitMethod : "SINGLE",
      note: note || null,
      participants: {
        create: shares.map((share) => ({
          userId: share.userId,
          shareMinor: share.shareMinor,
          baseShareMinor: share.baseShareMinor,
        })),
      },
    },
    select: { id: true },
  });
}
