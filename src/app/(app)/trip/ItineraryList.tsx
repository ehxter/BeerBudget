import { Card } from "@/components/ui";
import { ITINERARY_CATEGORIES, emojiFor } from "@/lib/constants";
import { formatMoney, type CurrencyCode } from "@/lib/money";

type ItineraryItem = {
  id: string;
  title: string;
  day: Date;
  startTime: string | null;
  location: string | null;
  category: string;
  estimatedCostMinor: number | null;
  estimatedCostCurrency: string | null;
};

export function ItineraryList({ items }: { items: ItineraryItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-6 text-center">
        <div className="text-3xl mb-2">📅</div>
        <h3 className="text-sm font-semibold text-ink">No plans yet</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Your itinerary is empty. Seed data will populate this!
        </p>
      </Card>
    );
  }

  // Group by day
  const grouped = items.reduce((acc, item) => {
    const dayStr = item.day.toISOString().split("T")[0];
    if (!acc[dayStr]) acc[dayStr] = [];
    acc[dayStr].push(item);
    return acc;
  }, {} as Record<string, ItineraryItem[]>);

  const days = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      {days.map((dayStr) => (
        <div key={dayStr} className="space-y-3">
          <h3 className="sticky top-0 z-10 bg-surface/90 py-1 text-sm font-bold tracking-tight text-ink backdrop-blur">
            {new Date(dayStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </h3>
          <div className="space-y-2 pl-2 border-l-2 border-surface-2">
            {grouped[dayStr].map((item) => (
              <div key={item.id} className="relative pl-4 py-1">
                <div className="absolute left-[-5px] top-3 h-2 w-2 rounded-full bg-surface-3 ring-4 ring-surface" />
                <div className="flex gap-3">
                  <div className="text-[20px]">
                    {emojiFor(ITINERARY_CATEGORIES, item.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold text-ink">{item.title}</span>
                      {item.startTime ? (
                        <span className="text-xs font-medium text-brand">{item.startTime}</span>
                      ) : null}
                    </div>
                    {item.location ? (
                      <div className="text-xs text-ink-muted mt-0.5">{item.location}</div>
                    ) : null}
                    {item.estimatedCostMinor ? (
                      <div className="text-xs font-medium text-ink-faint mt-1">
                        Est: {formatMoney(item.estimatedCostMinor, item.estimatedCostCurrency as CurrencyCode)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
