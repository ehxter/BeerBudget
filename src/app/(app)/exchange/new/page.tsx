import { requireUser } from "@/lib/auth";
import { getRateTable } from "@/lib/rates/store";
import { BASE_CURRENCY } from "@/lib/money";
import { Screen } from "@/components/ui";
import { LogExchangeForm } from "./LogExchangeForm";

export const metadata = { title: "Log exchange · Beer Budget" };
export const dynamic = "force-dynamic";

export default async function NewExchangePage() {
  await requireUser();
  const rates = await getRateTable();

  return (
    <Screen back="/exchange" title="Log Exchange" gap={4} className="animate-rise">
      <LogExchangeForm baseCurrency={BASE_CURRENCY} tomanPerUnit={rates.tomanPerUnit} />
    </Screen>
  );
}
