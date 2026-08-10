import Link from "next/link";
import { ChevronRight, Plus, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { requireTripContext } from "@/lib/trip";
import { getDashboard } from "@/lib/dashboard";
import { asCurrency, formatMoney } from "@/lib/money";
import { dateRange, relativeDay, clockTime, shortWeekday } from "@/lib/format";
import { EXPENSE_CATEGORIES, ITINERARY_CATEGORIES, emojiFor, labelFor } from "@/lib/constants";
import {
  Card,
  CardLabel,
  Row,
  ProgressBar,
  MiniBar,
  ButtonLink,
  EmptyState,
  SectionTitle,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export const metadata = { title: "Koskalak Planner" };
// The dashboard reflects data that changes on every expense; never cache it.
export const dynamic = "force-dynamic";

const PACE_LABEL = {
  under: { label: "Under budget", tone: "text-positive", Icon: TrendingDown },
  on_pace: { label: "On pace", tone: "text-ink-muted", Icon: Minus },
  over: { label: "Over pace", tone: "text-negative", Icon: TrendingUp },
} as const;

export default async function HomePage() {
  const ctx = await requireTripContext();
  const data = await getDashboard(ctx);
  const { trip, user, partner } = ctx;
  const base = trip.baseCurrency;

  const pace = PACE_LABEL[data.pace.status];
  const overBudget = data.remainingMinor < 0;

  return (
    <div className="animate-rise space-y-4">
      <header className="pb-1">
        <p className="text-xs font-medium text-ink-faint">
          Hey {user.name.split(" ")[0]}
        </p>
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-ink">
          {trip.name}
        </h1>
        <p className="mt-0.5 text-xs text-ink-faint">
          {trip.destination} · {dateRange(trip.startDate, trip.endDate)}
        </p>
      </header>

      {/* Budget burndown */}
      <Card>
        <div className="mb-3 flex items-start justify-between">
          <CardLabel>Trip budget</CardLabel>
          <span
            className={cn(
              "tnum text-xs font-semibold",
              overBudget ? "text-negative" : "text-ink-muted",
            )}
          >
            {Math.round(data.percentConsumed)}%
          </span>
        </div>

        <div className="tnum mb-3 text-[34px] font-bold leading-none tracking-tight text-ink">
          {formatMoney(trip.budgetMinor, base)}
        </div>

        <ProgressBar
          percent={data.percentConsumed}
          tone={overBudget ? "negative" : data.percentConsumed > 85 ? "warn" : "accent"}
          label="Budget consumed"
          className="mb-4"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-ink-faint">Spent</div>
            <div className="tnum mt-0.5 text-lg font-semibold text-ink">
              {formatMoney(data.spentMinor, base)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-ink-faint">
              {overBudget ? "Over by" : "Remaining"}
            </div>
            <div
              className={cn(
                "tnum mt-0.5 text-lg font-semibold",
                overBudget ? "text-negative" : "text-positive",
              )}
            >
              {formatMoney(Math.abs(data.remainingMinor), base)}
            </div>
          </div>
        </div>
      </Card>

      {/* Settlement */}
      <Link href="/settlement" className="block">
        <Card
          className={cn(
            "flex items-center justify-between gap-3 transition-colors active:bg-surface-2",
            data.settlement.netMinor > 0 && "border-positive/20 bg-positive-soft",
            data.settlement.netMinor < 0 && "border-negative/20 bg-negative-soft",
          )}
        >
          <div className="min-w-0">
            <div className="text-xs font-medium text-ink-faint">Settlement</div>
            {data.settlement.netMinor === 0 ? (
              <div className="mt-1 text-sm font-semibold text-ink">
                {partner ? "You're all square" : "Waiting for your travel partner"}
              </div>
            ) : (
              <>
                <div className="mt-1 truncate text-sm text-ink-muted">
                  {data.settlement.netMinor > 0
                    ? `${partner?.name ?? "Your friend"} owes you`
                    : `You owe ${partner?.name ?? "your friend"}`}
                </div>
                <div
                  className={cn(
                    "tnum mt-0.5 text-2xl font-bold tracking-tight",
                    data.settlement.netMinor > 0 ? "text-positive" : "text-negative",
                  )}
                >
                  {formatMoney(Math.abs(data.settlement.netMinor), base)}
                </div>
              </>
            )}
          </div>
          <ChevronRight size={20} className="shrink-0 text-ink-faint" />
        </Card>
      </Link>

      {/* Spending pace */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <CardLabel>Spending pace</CardLabel>
          <span
            className={cn("flex items-center gap-1 text-xs font-semibold", pace.tone)}
          >
            <pace.Icon size={13} />
            {pace.label}
          </span>
        </div>

        <Row
          label="Daily pace"
          hint={`${data.pace.daysElapsed} of ${data.pace.totalDays} days`}
          value={formatMoney(data.pace.dailyPaceMinor, base)}
        />
        <Row
          label="Recommended"
          hint={
            data.pace.daysRemaining > 0
              ? `${data.pace.daysRemaining} days left`
              : "Trip finished"
          }
          value={
            data.pace.daysRemaining > 0
              ? formatMoney(data.pace.recommendedDailyMinor, base)
              : "—"
          }
          valueClassName={
            data.pace.recommendedDailyMinor < 0 ? "text-negative" : undefined
          }
        />
        <div className="border-t border-line pt-3">
          <Row
            label="Projected total"
            value={formatMoney(data.pace.projectedTotalMinor, base)}
            valueClassName={data.pace.status === "over" ? "text-negative" : undefined}
          />
        </div>
      </Card>

      {/* Spending by day */}
      {data.expenseCount > 0 ? (
        <Card>
          <CardLabel className="mb-3 block">Spending by day</CardLabel>
          <div className="flex h-24 items-end gap-1">
            {data.days.map((day) => (
              <div
                key={day.date.toISOString()}
                className="flex flex-1 flex-col items-center gap-1.5"
                title={`${shortWeekday(day.date)}: ${formatMoney(day.totalMinor, base)}`}
              >
                <div className="flex h-full w-full items-end">
                  <div
                    className={cn(
                      "animate-rise w-full rounded-t-[3px]",
                      day.isToday ? "bg-accent" : "bg-surface-3",
                    )}
                    style={{
                      // Keep a 2px stub for empty days so the axis reads as a row of days.
                      height: `${Math.max(day.totalMinor > 0 ? 6 : 2, day.percentOfMax)}%`,
                    }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[9px] leading-none",
                    day.isToday ? "font-semibold text-accent" : "text-ink-faint",
                  )}
                >
                  {shortWeekday(day.date).slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Spending by category */}
      {data.categories.length > 0 ? (
        <Card className="space-y-3">
          <CardLabel>By category</CardLabel>
          {data.categories.slice(0, 5).map((entry) => (
            <div key={entry.category} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-ink-muted">
                  <span aria-hidden="true" className="mr-1.5">
                    {emojiFor(EXPENSE_CATEGORIES, entry.category)}
                  </span>
                  {labelFor(EXPENSE_CATEGORIES, entry.category)}
                </span>
                <span className="tnum shrink-0 text-sm font-semibold text-ink">
                  {formatMoney(entry.totalMinor, base)}
                </span>
              </div>
              <MiniBar percent={entry.percent} />
            </div>
          ))}
        </Card>
      ) : null}

      {/* Today */}
      <section>
        <SectionTitle
          action={
            <Link href="/spending" className="text-xs font-medium text-accent">
              All spending
            </Link>
          }
        >
          Today
        </SectionTitle>

        {data.todaysExpenses.length === 0 ? (
          <EmptyState
            title="Nothing spent yet today"
            description="Add an expense the moment you pay — it takes about five seconds."
            action={
              <ButtonLink href="/spending/new" size="sm">
                <Plus size={16} />
                Add expense
              </ButtonLink>
            }
          />
        ) : (
          <div className="space-y-2">
            {data.todaysExpenses.map((expense) => (
              <Card key={expense.id} className="flex items-center gap-3 py-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-base"
                >
                  {emojiFor(EXPENSE_CATEGORIES, expense.category)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {expense.description}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-ink-faint">
                    {expense.isShared
                      ? `${expense.paidBy.id === user.id ? "You" : expense.paidBy.name} paid`
                      : "Private"}{" "}
                    · {clockTime(expense.spentAt)}
                  </div>
                </div>
                <div className="tnum shrink-0 text-right text-sm font-semibold text-ink">
                  {formatMoney(expense.amountMinor, asCurrency(expense.currency))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming itinerary */}
      <section>
        <SectionTitle
          action={
            <Link href="/trip" className="text-xs font-medium text-accent">
              Itinerary
            </Link>
          }
        >
          Coming up
        </SectionTitle>

        {data.itinerary.length === 0 ? (
          <EmptyState
            title="No plans scheduled"
            description="Add stops to the itinerary to see them here."
            action={
              <ButtonLink href="/trip" size="sm" variant="secondary">
                Plan the trip
              </ButtonLink>
            }
          />
        ) : (
          <div className="space-y-2">
            {data.itinerary.map((item) => (
              <Card key={item.id} className="flex items-center gap-3 py-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-base"
                >
                  {emojiFor(ITINERARY_CATEGORIES, item.category)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {item.title}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-ink-faint">
                    {relativeDay(item.day)}
                    {item.startTime ? ` · ${item.startTime}` : ""}
                    {item.location ? ` · ${item.location}` : ""}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
