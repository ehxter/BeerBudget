import { requireUser } from "@/lib/auth";
import { getManualRate, getRateTable } from "@/lib/rates/store";
import { BASE_CURRENCY } from "@/lib/money";
import { Screen, ButtonLink, Tabs } from "@/components/ui";
import { relativeTimeAgo } from "@/lib/format";
import { Converter } from "./Converter";
import { ExchangeList } from "./ExchangeList";
import { RefreshRates } from "./RefreshRates";
import { RateSourceToggle } from "./RateSourceToggle";

export const metadata = { title: "Exchange · Istanbul" };
export const dynamic = "force-dynamic";

/**
 * Exchange: the converter and the log of exchanges you've actually made, as
 * two tabs. Both panels are rendered here on the server, so switching between
 * "what should this cost" and "what did I get last time" is instant — which is
 * the comparison you're making while standing at a counter.
 */
export default async function ExchangePage() {
  const user = await requireUser();
  const [rates, manualUsd] = await Promise.all([getRateTable(), getManualRate("USD")]);

  // The rate store keeps working when a provider is down, so the UI has to say
  // when it's serving older numbers rather than pass them off as current. It
  // describes the dollar specifically, because that is the figure every other
  // currency on the screen is derived from.
  const freshness =
    rates.anchorOrigin === "bootstrap"
      ? "Fallback rates — nothing reached"
      : !rates.anchorAt
        ? "Not fetched yet"
        : rates.anchorOrigin === "manual"
          ? `Your rate · ${relativeTimeAgo(rates.anchorAt)}`
          : `Updated ${relativeTimeAgo(rates.anchorAt)}`;

  return (
    <Screen
      logo
      gap={4}
      className="animate-rise"
      action={<ButtonLink href="/exchange/new">Log Exchange</ButtonLink>}
    >
      <Tabs
        tabs={[
          {
            value: "converter",
            label: "Converter",
            content: (
              <div className="flex flex-col gap-4">
                <Converter
                  baseCurrency={BASE_CURRENCY}
                  tomanPerUnit={rates.tomanPerUnit}
                />
                <RefreshRates freshness={freshness} />
                <RateSourceToggle
                  automatic={rates.mode === "AUTO"}
                  manualUsdToman={manualUsd?.tomanPerUnit ?? null}
                />
              </div>
            ),
          },
          {
            value: "history",
            label: "History",
            content: <ExchangeList userId={user.id} />,
          },
        ]}
      />
    </Screen>
  );
}
