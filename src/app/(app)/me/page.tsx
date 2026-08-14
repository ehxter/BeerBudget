import { Coins } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/lib/dashboard";
import { BASE_CURRENCY } from "@/lib/money";
import { Screen, Divider, ButtonLink, CardButtonLink } from "@/components/ui";
import { SignOutButton } from "@/components/shell/SignOutButton";
import { BudgetTracker } from "./BudgetTracker";

export const metadata = { title: "Me · Istanbul" };
export const dynamic = "force-dynamic";

/**
 * Me: the budget, and the account it belongs to. It reads the same dashboard
 * as Home, so the two can't disagree about what's left.
 */
export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const user = await requireUser();
  const { action } = await searchParams;

  const data = await getDashboard(user.id);
  const entered = data.budgetEntered;

  return (
    <Screen
      logo
      gap={4}
      className="animate-rise"
      action={<ButtonLink href="/me?action=new">Add Budget</ButtonLink>}
    >
      <BudgetTracker
        // Remounts when the saved budget changes, which closes the editor
        // without a setState-inside-effect.
        key={`${data.budgetMinor}-${entered?.currency ?? BASE_CURRENCY}`}
        budgetMinor={data.budgetMinor}
        enteredMinor={entered?.amountMinor ?? 0}
        enteredCurrency={entered?.currency ?? BASE_CURRENCY}
        spentMinor={data.spentMinor}
        debtMinor={data.debt.netMinor}
        startOpen={action === "new"}
      />

      <div className="flex flex-col gap-4 pt-2">
        <Divider soft />
        <p className="px-1 text-label text-ink-5">
          {user.name} · {user.email}
        </p>
        <CardButtonLink href="/me/rates">
          <Coins size={16} className="mr-1.5" />
          Rates
        </CardButtonLink>
        <SignOutButton />
      </div>
    </Screen>
  );
}
