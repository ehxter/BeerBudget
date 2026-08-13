import { requireUser } from "@/lib/auth";
import { SettlementScreen } from "./SettlementScreen";
import { listDebts } from "./query";

export const metadata = { title: "Settlement · Istanbul" };
export const dynamic = "force-dynamic";

/**
 * Settlement, reached from Home. A private ledger of money owed between the
 * traveler and their one travel companion — no second account is involved, so
 * both sides of it are recorded here by hand.
 *
 * The same ledger is also the second tab on Spending, for logging a debt
 * without leaving the costs you were already looking at.
 */
export default async function SettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const user = await requireUser();
  const { action } = await searchParams;
  const debts = await listDebts(user.id);

  return <SettlementScreen debts={debts} startOpen={action === "new"} />;
}
