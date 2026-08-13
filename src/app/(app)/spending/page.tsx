import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { SpendingScreen } from "./SpendingScreen";
import { listDebts } from "../settlement/query";

export const metadata = { title: "Spending · Istanbul" };
export const dynamic = "force-dynamic";

/**
 * Spending is the cost feed itself — the charts it used to carry live on Home,
 * so there's no analytics screen standing between you and your costs.
 *
 * The debt ledger rides along as a second tab. It has its own screen off Home
 * too, but a debt is usually remembered while looking at what you just spent,
 * and this saves the trip back through Home to log one.
 */
export default async function SpendingPage() {
  const user = await requireUser();

  const [expenses, debts] = await Promise.all([
    prisma.expense.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        description: true,
        category: true,
        amountMinor: true,
        currency: true,
        baseAmountMinor: true,
        spentAt: true,
        note: true,
      },
      orderBy: { spentAt: "desc" },
      take: 500,
    }),
    listDebts(user.id),
  ]);

  return <SpendingScreen expenses={expenses} debts={debts} />;
}
