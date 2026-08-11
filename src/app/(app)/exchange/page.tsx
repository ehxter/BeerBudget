import { requireTripContext } from "@/lib/trip";
import { getRateTable } from "@/lib/rates/store";
import { Screen, SectionHeader, ButtonLink } from "@/components/ui";
import { relativeTimeAgo } from "@/lib/format";
import { Converter } from "./Converter";
import { ExchangeList } from "./ExchangeList";

export const metadata = { title: "Exchange · Istanbul" };
export const dynamic = "force-dynamic";

export default async function ExchangePage() {
  const { trip } = await requireTripContext();
  const rates = await getRateTable();

  // The rate store keeps working when the provider is down, so the UI has to
  // say when it's serving older numbers rather than pass them off as current.
  const freshness = rates.usingBootstrap
    ? "Fallback rates — provider unreachable"
    : rates.fetchedAt
      ? `Updated ${relativeTimeAgo(rates.fetchedAt)}`
      : "Not fetched yet";

  return (
    <Screen
      trip={{ emoji: trip.emoji, name: trip.name }}
      gap={8}
      className="animate-rise"
      action={<ButtonLink href="/exchange/new">Log Exchange</ButtonLink>}
    >
      <Converter baseCurrency={trip.baseCurrency} tomanPerUnit={rates.tomanPerUnit} />

      <section className="flex flex-col gap-2.5">
        <SectionHeader label="Recent exchanges" value={freshness} />
        <ExchangeList tripId={trip.id} />
      </section>
    </Screen>
  );
}
