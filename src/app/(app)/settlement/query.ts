import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * The ledger read, in one place — the Settlement screen and the Settlement tab
 * on Spending render the same component and must hand it the same shape.
 */
export function listDebts(userId: string) {
  return prisma.debt.findMany({
    where: { userId },
    select: {
      id: true,
      direction: true,
      amountMinor: true,
      currency: true,
      baseAmountMinor: true,
      description: true,
      occurredAt: true,
      settledAt: true,
    },
    orderBy: { occurredAt: "desc" },
  });
}
