import { requireTripContext } from "@/lib/trip";
import { Screen } from "@/components/ui";
import { AddPlaceForm } from "./AddPlaceForm";

export const metadata = { title: "Add place · Istanbul" };
export const dynamic = "force-dynamic";

/**
 * Not in the Figma frames, but Wishlist needs somewhere new places come
 * from — matches Add Event's shape: back chevron as cancel, one form, one
 * primary submit.
 */
export default async function NewPlacePage() {
  const { trip } = await requireTripContext();

  return (
    <Screen back="/trip?tab=wishlist" title="Add Place" gap={4} className="animate-rise">
      <AddPlaceForm baseCurrency={trip.baseCurrency} />
    </Screen>
  );
}
