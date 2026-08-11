import { requireTripContext } from "@/lib/trip";
import { getRateTable } from "@/lib/rates/store";
import { Screen } from "@/components/ui";
import { LogExchangeForm } from "./LogExchangeForm";

export const metadata = { title: "Log exchange · Istanbul" };
export const dynamic = "force-dynamic";

export default async function NewExchangePage() {
  const { trip } = await requireTripContext();
  const rates = await getRateTable();

  return (
    <Screen back="/exchange" title="Log Exchange" gap={4} className="animate-rise">
      <LogExchangeForm baseCurrency={trip.baseCurrency} tomanPerUnit={rates.tomanPerUnit} />
    </Screen>
  );
}
