import Link from "next/link";
import { Plus } from "lucide-react";
import { requireTripContext } from "@/lib/trip";
import { getRateTable } from "@/lib/rates/store";
import { type CurrencyCode } from "@/lib/money";
import { PageHeader } from "@/components/ui";
import { Converter } from "./Converter";
import { ExchangeList } from "./ExchangeList";

export const metadata = { title: "Exchange · Istanbul" };
export const dynamic = "force-dynamic";

export default async function ExchangePage() {
  const { trip } = await requireTripContext();
  const rates = await getRateTable();

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Currency & Exchange" back="/" />
      
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted px-1">
          Live Converter
        </h2>
        <Converter baseCurrency={trip.baseCurrency as CurrencyCode} tomanPerUnit={rates.tomanPerUnit} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
            Recent Exchanges
          </h2>
          <Link
            href="/exchange/new"
            className="flex items-center gap-1 text-xs font-medium text-brand hover:text-brand/80"
          >
            <Plus size={14} />
            Log exchange
          </Link>
        </div>
        <ExchangeList tripId={trip.id} />
      </section>
    </div>
  );
}
