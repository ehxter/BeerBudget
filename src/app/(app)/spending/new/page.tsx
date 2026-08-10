import { requireTripContext } from "@/lib/trip";
import { getRateTable } from "@/lib/rates/store";
import { PageHeader } from "@/components/ui";
import { AddExpenseForm } from "./AddExpenseForm";

export const metadata = { title: "Add expense · Koskalak Planner" };
export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  const { trip, user, partner } = await requireTripContext();
  const rates = await getRateTable();

  return (
    <div className="animate-rise space-y-4">
      <PageHeader title="Add expense" back="/spending" />
      <AddExpenseForm
        self={{ id: user.id, name: user.name }}
        partner={partner}
        baseCurrency={trip.baseCurrency}
        tomanPerUnit={rates.tomanPerUnit}
      />
    </div>
  );
}
