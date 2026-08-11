import { Card, EmptyState } from "@/components/ui";
import { formatMoney, asCurrency } from "@/lib/money";
import { weekdayAndDate } from "@/lib/format";

type Item = {
  id: string;
  title: string;
  day: Date;
  startTime: string | null;
  location: string | null;
  estimatedCostMinor: number | null;
  estimatedCostCurrency: string | null;
};

/**
 * Figma "Agenda" tab: a flat list of Event cards (no day grouping — the
 * design shows one continuous list), each with title/date/time and a Google
 * Maps button.
 */
export function AgendaList({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-title">🗓</span>}
        title="Nothing on the agenda"
        description="Add the things you've already planned — flights, tickets, bookings."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const mapsUrl = item.location
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`
          : null;

        return (
          <Card key={item.id} pad={20}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-meta font-bold text-ink">{item.title}</p>
                <p className="mt-1 truncate text-label font-medium text-ink-4">
                  {weekdayAndDate(item.day)}
                  {item.startTime ? ` — ${item.startTime}` : ""}
                </p>
              </div>
              {item.estimatedCostMinor ? (
                <p className="tnum shrink-0 text-cat font-semibold text-ink-3">
                  {formatMoney(item.estimatedCostMinor, asCurrency(item.estimatedCostCurrency))}
                </p>
              ) : null}
            </div>

            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-[42px] w-full items-center justify-center rounded-pill bg-action text-meta font-semibold text-action-ink-soft active:bg-action/85"
              >
                Google Maps
              </a>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
