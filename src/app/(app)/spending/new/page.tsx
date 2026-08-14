import { requireUser } from "@/lib/auth";
import { getRateTable } from "@/lib/rates/store";
import { Screen } from "@/components/ui";
import { AddExpenseForm } from "./AddExpenseForm";

export const metadata = { title: "Add cost · Beer Budget" };
export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  await requireUser();
  const rates = await getRateTable();

  return (
    <Screen back="/spending" title="Add Cost" gap={4} className="animate-rise">
      <AddExpenseForm tomanPerUnit={rates.tomanPerUnit} />
    </Screen>
  );
}
