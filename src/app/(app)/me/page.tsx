import { requireTripContext } from "@/lib/trip";
import { prisma } from "@/lib/prisma";
import { type CurrencyCode } from "@/lib/money";
import { PageHeader } from "@/components/ui";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { BudgetTracker } from "./BudgetTracker";
import { PrivateNotes } from "./PrivateNotes";
import { Vault } from "./Vault";

export const metadata = { title: "Me · Koskalak Planner" };
export const dynamic = "force-dynamic";

export default async function MePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { trip, user } = await requireTripContext();
  const { tab } = await searchParams;
  const currentTab = tab || "budget";

  // Fetch all personal data
  const [budget, notes, vaultItems, expenses] = await Promise.all([
    prisma.budget.findUnique({
      where: { userId_tripId: { userId: user.id, tripId: trip.id } },
    }),
    prisma.privateNote.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.privateVaultItem.findMany({
      where: { userId: user.id },
      include: { files: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { tripId: trip.id, isShared: false, paidById: user.id },
    }),
  ]);

  // Calculate private spent total
  const spentMinor = expenses.reduce((total, exp) => total + exp.baseAmountMinor, 0);

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Me (Private)" back="/" />

      <TabSwitcher
        name="tab"
        options={[
          { value: "budget", label: "Budget" },
          { value: "notes", label: "Notes" },
          { value: "vault", label: "Vault" },
        ]}
        defaultValue={currentTab}
      />

      <div className="animate-rise">
        {currentTab === "budget" && (
          <BudgetTracker 
            budgetMinor={budget?.amountMinor || 0}
            budgetCurrency={(budget?.currency as CurrencyCode) || (trip.baseCurrency as CurrencyCode)}
            spentMinor={spentMinor}
          />
        )}
        {currentTab === "notes" && <PrivateNotes notes={notes} />}
        {currentTab === "vault" && <Vault items={vaultItems} />}
      </div>
    </div>
  );
}
