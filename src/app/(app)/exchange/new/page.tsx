import { requireTripContext } from "@/lib/trip";
import { PageHeader } from "@/components/ui";
import { type CurrencyCode } from "@/lib/money";
import { LogExchangeForm } from "./LogExchangeForm";

export const metadata = { title: "Log Exchange · Istanbul" };
export const dynamic = "force-dynamic";

export default async function NewExchangePage() {
  const { trip } = await requireTripContext();

  return (
    <div className="animate-rise space-y-4">
      <PageHeader title="Log Exchange" back="/exchange" />
      <LogExchangeForm baseCurrency={trip.baseCurrency as CurrencyCode} />
    </div>
  );
}
