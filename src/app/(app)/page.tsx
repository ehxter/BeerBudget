import { requireTripContext } from "@/lib/trip";
import { getDashboard } from "@/lib/dashboard";
import { CURRENCY_META, formatMoney } from "@/lib/money";
import { relativeDay } from "@/lib/format";
import { Screen, Card, CardLabel, ProgressBar, ButtonLink, Donut, DonutLegend } from "@/components/ui";
import { cn } from "@/lib/cn";

export const metadata = { title: "Beer Budget" };
export const dynamic = "force-dynamic";

/**
 * Home, from the Figma "Home — Full and Event" / "Home — Empty" frames:
 * Next Event (amber glow when one exists), Budget Left, and the STATS donut.
 * The design has no spending-pace section and no per-user toggle, so neither
 * is here.
 */
export default async function HomePage() {
  const ctx = await requireTripContext();
  const data = await getDashboard(ctx);
  const { trip } = ctx;
  const base = trip.baseCurrency;

  const overBudget = data.remainingMinor < 0;

  const mapsUrl = data.nextEvent?.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.nextEvent.location)}`
    : null;

  return (
    <Screen
      trip={{ emoji: trip.emoji, name: trip.name }}
      gap={4}
      className="animate-rise"
      action={<ButtonLink href="/spending/new">Add Cost</ButtonLink>}
    >
      {data.nextEvent ? (
        <Card pad={20} glow>
          <CardLabel>Next event</CardLabel>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-meta font-bold text-ink">
                {data.nextEvent.title}
              </p>
              <p className="mt-1 truncate text-label font-medium text-ink-4">
                {relativeDay(data.nextEvent.day)}
                {data.nextEvent.location ? ` — ${data.nextEvent.location}` : ""}
              </p>
            </div>
            {data.nextEvent.startTime ? (
              <p className="tnum shrink-0 text-figure font-semibold text-ink">
                {data.nextEvent.startTime}
              </p>
            ) : null}
          </div>

          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-[42px] w-full items-center justify-center rounded-pill bg-white/[0.06] text-meta font-semibold text-action-ink-soft active:bg-action/85"
            >
              Google Maps
            </a>
          ) : null}
        </Card>
      ) : (
        <Card pad={18}>
          <CardLabel>No upcoming event</CardLabel>
        </Card>
      )}

      <Card pad={18}>
        <CardLabel>{overBudget ? "Over budget" : "Budget left"}</CardLabel>

        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "tnum text-figure font-semibold",
              overBudget ? "text-cat-6" : "text-ink",
            )}
          >
            {formatMoney(Math.abs(data.remainingMinor), base, { bare: true })}
          </span>
          <span className="text-meta font-semibold text-ink-5">
            {CURRENCY_META[base].unit}
          </span>
        </div>

        <ProgressBar
          percent={data.percentConsumed}
          tone={overBudget ? "negative" : "positive"}
          label="Budget consumed"
        />

        <div className="flex items-center justify-between text-label font-medium text-ink-3">
          <span className="tnum">
            {formatMoney(data.spentMinor, base, { bare: true })} Spent
          </span>
          <span className="tnum">
            {formatMoney(trip.budgetMinor, base, { bare: true })} Total
          </span>
        </div>
      </Card>

      <Card pad={18} radius="lg">
        <CardLabel>Stats</CardLabel>

        <div className="flex items-center gap-5 py-2">
          <DonutLegend items={data.chart} />
          <Donut slices={data.chart} size={156} />
        </div>

        <ButtonLink
          href="/spending"
          variant="onCard"
          size="block"
          className="font-semibold bg-white/[0.06] text-[14px]"
        >
          Spendings
        </ButtonLink>
      </Card>
    </Screen>
  );
}
