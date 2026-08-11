import { requireTripContext } from "@/lib/trip";
import { getRateTable } from "@/lib/rates/store";
import { Screen } from "@/components/ui";
import { AddExpenseForm } from "./AddExpenseForm";

export const metadata = { title: "Add cost · Istanbul" };
export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  const { trip, user, partner } = await requireTripContext();
  const rates = await getRateTable();

  return (
    <Screen back="/spending" title="Add Cost" gap={4} className="animate-rise">
      <AddExpenseForm
        self={{ id: user.id, name: user.name }}
        partner={partner}
        baseCurrency={trip.baseCurrency}
        tomanPerUnit={rates.tomanPerUnit}
      />
    </Screen>
  );
}
