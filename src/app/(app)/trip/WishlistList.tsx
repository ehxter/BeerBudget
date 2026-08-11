import { Card, EmptyState, SubmitButton } from "@/components/ui";
import { formatMoney, asCurrency } from "@/lib/money";
import { PLACE_CATEGORIES, labelFor } from "@/lib/constants";
import { movePlaceToAgenda } from "./actions";

type Place = {
  id: string;
  name: string;
  category: string;
  address: string | null;
  estimatedPriceMinor: number | null;
  estimatedPriceCurrency: string | null;
  status: string;
};

/**
 * Figma "Wishlist" tab: the identical Event-card component, but the button
 * reads "Move to Agenda" instead of "Google Maps". There's no dedicated
 * Places model in the design, so this is wired to the app's saved places —
 * "Move to Agenda" is a real action: it creates the itinerary item and marks
 * the place planned.
 */
export function WishlistList({ places }: { places: Place[] }) {
  if (places.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-title">📍</span>}
        title="Wishlist is empty"
        description="Places you're considering — save them here, then move the ones you commit to onto the agenda."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {places.map((place) => (
        <Card key={place.id} pad={20}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-meta font-bold text-ink">{place.name}</p>
              <p className="mt-1 truncate text-label font-medium text-ink-4">
                {labelFor(PLACE_CATEGORIES, place.category)}
                {place.address ? ` — ${place.address}` : ""}
              </p>
            </div>
            {place.estimatedPriceMinor ? (
              <p className="tnum shrink-0 text-cat font-semibold text-ink-3">
                {formatMoney(
                  place.estimatedPriceMinor,
                  asCurrency(place.estimatedPriceCurrency),
                )}
              </p>
            ) : null}
          </div>

          <form action={movePlaceToAgenda}>
            <input type="hidden" name="placeId" value={place.id} />
            <SubmitButton
              variant="onCard"
              size="block"
              className="font-semibold"
              pendingLabel="Moving…"
            >
              Move to Agenda
            </SubmitButton>
          </form>
        </Card>
      ))}
    </div>
  );
}
