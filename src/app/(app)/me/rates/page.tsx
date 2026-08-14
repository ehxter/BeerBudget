import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getRateSources } from "@/lib/rates/store";
import { Screen, Card, CardLabel, Divider } from "@/components/ui";
import { relativeTimeAgo } from "@/lib/format";
import { ManualRateForm } from "./ManualRateForm";
import { RetryButton } from "./RetryButton";

export const metadata = { title: "Rates · Beer Budget" };
export const dynamic = "force-dynamic";

/** The three keyless cross-rate providers, by the name stored on their rows. */
const FX_PROVIDER_LABELS: Record<string, string> = {
  FRANKFURTER: "Frankfurter (ECB)",
  ERAPI: "ExchangeRate-API",
  CURRENCYAPI: "Currency-API",
};

/** The Toman providers, in the order the store tries them. */
const TOMAN_PROVIDER_LABELS: Record<string, string> = {
  TGJU: "TGJU",
  BRSAPI: "BrsApi",
};

function ago(at: Date | null): string {
  return at ? `Updated ${relativeTimeAgo(at)}` : "Never reached";
}

/**
 * Rates: where the numbers come from, and how to take over when they stop
 * coming.
 *
 * The screen is deliberately readable with no network at all — it reads only
 * the cache, because it is where you end up precisely when the connection is
 * the thing that has gone wrong.
 */
export default async function RatesPage() {
  await requireUser();
  const sources = await getRateSources();

  const automatic = sources.mode === "AUTO";

  return (
    <Screen back="/me" title="Rates" gap={4} className="animate-rise">
      <Card pad={20}>
        <CardLabel>Now in charge</CardLabel>
        <p className="text-row font-medium text-ink-2">
          {automatic ? "The rate providers" : "Your own dollar rate"}
        </p>
        <p className="-mt-2 text-meta text-ink-4">
          {automatic
            ? "The providers below set the dollar; your rate stands by in case none can be reached."
            : "The dollar below sets every price in the app."}{" "}
          <Link
            href="/exchange"
            className="text-ink-3 underline underline-offset-2"
          >
            Change on Exchange
          </Link>
        </p>
      </Card>

      <ManualRateForm
        // Remounts when the saved rate changes, so the input reflects what was
        // actually written rather than what was last typed into it.
        key={sources.manual?.tomanPerUnit ?? "unset"}
        savedUsdToman={sources.manual?.tomanPerUnit ?? null}
        providerUsdToman={
          // The one actually in charge, so the "provider currently says" hint
          // matches the figure the converter is using.
          (sources.toman.find((p) => p.active) ?? sources.toman.find((p) => p.usdToman))
            ?.usdToman ?? null
        }
        usdPerUnit={sources.fx?.usdPerUnit ?? {}}
      />

      <Card pad={20}>
        <CardLabel>Sources</CardLabel>

        <div className="flex flex-col gap-3">
          {sources.toman.map((entry, index) => (
            <div key={entry.source}>
              {index > 0 ? <div className="mb-3"><Divider soft /></div> : null}
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-meta text-ink-2">
                    {TOMAN_PROVIDER_LABELS[entry.source] ?? entry.source}
                    {entry.active ? (
                      <span className="ml-1.5 text-caps text-ink-5">· in use</span>
                    ) : null}
                  </p>
                  <p className="text-caps text-ink-5">
                    {index === 0
                      ? "Toman price of the dollar"
                      : "Standby for the same numbers"}
                  </p>
                </div>
                <span className="shrink-0 text-meta text-ink-4">
                  {ago(entry.fetchedAt)}
                </span>
              </div>
            </div>
          ))}

          <Divider soft />

          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="text-meta text-ink-2">
                {sources.fx
                  ? (FX_PROVIDER_LABELS[sources.fx.source] ?? sources.fx.source)
                  : "Cross rates"}
              </p>
              <p className="text-caps text-ink-5">
                {sources.fx
                  ? "Euro and Lira against the dollar"
                  : "Three providers tried in turn"}
              </p>
            </div>
            <span className="shrink-0 text-meta text-ink-4">
              {ago(sources.fx?.fetchedAt ?? null)}
            </span>
          </div>

          {sources.manual ? (
            <>
              <Divider soft />
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-meta text-ink-2">Your rate</p>
                  <p className="text-caps text-ink-5">Typed on this screen</p>
                </div>
                <span className="shrink-0 text-meta text-ink-4">
                  Saved {relativeTimeAgo(sources.manual.fetchedAt)}
                </span>
              </div>
            </>
          ) : null}
        </div>

        <Divider />
        <RetryButton />
      </Card>
    </Screen>
  );
}
