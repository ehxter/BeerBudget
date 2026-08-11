import { requireTripContext } from "@/lib/trip";
import { prisma } from "@/lib/prisma";
import { asCurrency, convertMinor } from "@/lib/money";
import { getRateTable, rateFromTable } from "@/lib/rates/store";
import { Screen, TabSwitcher, Divider, ButtonLink } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { BudgetTracker } from "./BudgetTracker";
import { PrivateNotes } from "./PrivateNotes";
import { Vault } from "./Vault";

export const metadata = { title: "Me · Istanbul" };
export const dynamic = "force-dynamic";

/**
 * Me, from the Figma "Me" frames: trip emoji + name in the header (same as
 * every other root screen — this is not a profile page), a Budget/Vault
 * segmented pair, and a header pill whose label depends on which tab is
 * active ("Add Budget" / "Add Item"). The frames' body content was an
 * unfinished placeholder (reused Trip event cards), so Budget and Vault below
 * are derived from the app's actual data, styled with the same tokens.
 * Private notes have no Figma destination of their own, so they live inside
 * the Vault tab rather than inventing a third segment.
 */
export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; action?: string }>;
}) {
  const { trip, user } = await requireTripContext();
  const { tab, action } = await searchParams;
  const currentTab = tab === "vault" ? "vault" : "budget";
  const shouldOpen = action === "new";

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
      select: { baseAmountMinor: true },
    }),
  ]);

  const budgetCurrency = asCurrency(budget?.currency ?? trip.baseCurrency);

  // Private expenses are stored in the trip's base currency. A personal budget
  // can be set in a different one, so the total has to be converted before the
  // two are compared — otherwise the bar measures lira against dollars.
  const spentBaseMinor = expenses.reduce((t, e) => t + e.baseAmountMinor, 0);
  const rates = await getRateTable();
  const spentMinor = convertMinor(
    spentBaseMinor,
    trip.baseCurrency,
    budgetCurrency,
    rateFromTable(rates, trip.baseCurrency, budgetCurrency),
  );

  return (
    <Screen
      trip={{ emoji: trip.emoji, name: trip.name }}
      gap={4}
      className="animate-rise"
      action={
        currentTab === "budget" ? (
          <ButtonLink href="/me?tab=budget&action=new">Add Budget</ButtonLink>
        ) : (
          <ButtonLink href="/me?tab=vault&action=new">Add Item</ButtonLink>
        )
      }
    >
      <TabSwitcher
        name="tab"
        defaultValue="budget"
        options={[
          { value: "budget", label: "Budget" },
          { value: "vault", label: "Vault" },
        ]}
      />

      <div className="animate-fade-in flex flex-col gap-4">
        {currentTab === "budget" ? (
          <BudgetTracker
            // Remounts when the saved budget changes, which closes the editor
            // without a setState-inside-effect.
            key={`${budget?.amountMinor ?? 0}-${budgetCurrency}`}
            budgetMinor={budget?.amountMinor ?? 0}
            budgetCurrency={budgetCurrency}
            spentMinor={spentMinor}
            startOpen={shouldOpen}
          />
        ) : (
          <>
            <Vault items={vaultItems} startOpen={shouldOpen} />
            <PrivateNotes notes={notes} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-4 pt-2">
        <Divider soft />
        <p className="px-1 text-label text-ink-5">{user.email}</p>
        <SignOutButton />
      </div>
    </Screen>
  );
}
