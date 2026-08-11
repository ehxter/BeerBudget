import { requireTripContext } from "@/lib/trip";
import { Screen } from "@/components/ui";
import { AddEventForm } from "./AddEventForm";

export const metadata = { title: "Add event · Istanbul" };
export const dynamic = "force-dynamic";

/**
 * Not in the Figma frames, but "Add Event" is a real pill on the Trip
 * header, so it needs somewhere to go. The back chevron is the cancel
 * action, matching how History's back-arrow + pill header already works —
 * no second "Cancel" pill competing with it.
 */
export default async function NewEventPage() {
  const { trip } = await requireTripContext();

  return (
    <Screen back="/trip" title="Add Event" gap={4} className="animate-rise">
      <AddEventForm baseCurrency={trip.baseCurrency} tripStart={trip.startDate} />
    </Screen>
  );
}
