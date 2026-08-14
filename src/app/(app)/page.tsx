import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/lib/dashboard";
import { BASE_CURRENCY, CURRENCY_META, formatMoney } from "@/lib/money";
import {
  Screen,
  Card,
  CardLabel,
  Divider,
  ProgressBar,
  ButtonLink,
  CardButtonLink,
  CategoryBars,
  Donut,
  DonutLegend,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export const metadata = { title: "Beer Budget" };
export const dynamic = "force-dynamic";

/**
 * Home: three widgets and the way through to the debt ledger.
 *
 * Everything on this screen is in Lira, including costs that were paid in
 * dollars, euros, or toman — each was converted when it was recorded, so
 * these totals never need the network and never move on their own.
 */
export default async function HomePage() {
  const user = await requireUser();
  const data = await getDashboard(user.id);
  const base = BASE_CURRENCY;

  const overBudget = data.remainingMinor < 0;
  const hasBudget = data.budgetMinor > 0;
  const { netMinor } = data.debt;

  return (
    <Screen
      logo
      gap={4}
      className="animate-rise"
      action={<ButtonLink href="/spending/new">Add Cost</ButtonLink>}
    >
      {/* Home's three widgets run 24px in from each side rather than the 20px
          the shared Card preset uses — px-6 on each of them, not a change to
          `pad`, which the other screens still want at 20.

          Widget 1 — the budget. Never resets: every cost ever recorded counts
          against it, and the unsettled debt balance moves it up or down. */}
      <Card pad={18} className="px-6">
        <CardLabel>{overBudget ? "Over budget" : "Budget left"}</CardLabel>

        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "tnum text-display font-semibold",
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
            {formatMoney(data.effectiveBudgetMinor, base, { bare: true })} Total
          </span>
        </div>

        {/* The debt line only earns its space when there is a debt. Without it
            the Total silently disagrees with what was set on the Me screen. */}
        {netMinor !== 0 ? (
          <>
            <Divider soft />
            <div className="flex items-center justify-between text-label font-medium">
              <span className="text-ink-5">
                {netMinor > 0 ? "Owed to you" : "You owe"}
              </span>
              <span
                className={cn("tnum", netMinor > 0 ? "text-cat-4" : "text-cat-6")}
              >
                {netMinor > 0 ? "+" : "−"}
                {formatMoney(Math.abs(netMinor), base)}
              </span>
            </div>
          </>
        ) : null}

        {!hasBudget ? (
          <p className="text-label leading-relaxed text-ink-5">
            No budget set yet — set one on the Me screen and this fills in.
          </p>
        ) : null}
      </Card>

      {/* Widget 2 — the split of what's been spent, by share. */}
      <Card pad={18} radius="lg" className="px-6">
        <CardLabel>Stats</CardLabel>

        <div className="flex items-center gap-5 py-2">
          <DonutLegend items={data.chart} />
          <Donut slices={data.chart} size={156} />
        </div>
      </Card>

      {/* Widget 3 — the same six categories, but in money rather than share.
          Same top padding as the other two, so all three read as one stack,
          but 8px more underneath: the last bar sits tight against the card
          edge otherwise, with none of the breathing room the rows above it get
          from the row beneath them. */}
      <Card pad={18} className="px-6 pb-6">
        <CardLabel>By category</CardLabel>
        <CategoryBars slices={data.chart} currency={base} />
      </Card>

      <CardButtonLink href="/settlement">Settlement</CardButtonLink>
    </Screen>
  );
}
