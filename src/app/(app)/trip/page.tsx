import { requireTripContext } from "@/lib/trip";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { Checklist } from "./Checklist";
import { ItineraryList } from "./ItineraryList";
import { SharedInfo } from "./SharedInfo";

export const metadata = { title: "Trip · Istanbul" };
export const dynamic = "force-dynamic";

export default async function TripPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { trip } = await requireTripContext();
  const { tab } = await searchParams;
  const currentTab = tab || "itinerary";

  // Fetch all data in parallel
  const [checklist, itinerary, sharedInfo] = await Promise.all([
    prisma.checklistItem.findMany({
      where: { tripId: trip.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.itineraryItem.findMany({
      where: { tripId: trip.id },
      orderBy: [{ day: "asc" }, { sortOrder: "asc" }, { startTime: "asc" }],
    }),
    prisma.sharedInfo.findMany({
      where: { tripId: trip.id },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Trip Details" back="/" />

      <TabSwitcher
        name="tab"
        options={[
          { value: "itinerary", label: "Itinerary" },
          { value: "info", label: "Shared Info" },
          { value: "checklist", label: "Checklist" },
        ]}
        defaultValue={currentTab}
      />

      <div className="animate-rise">
        {currentTab === "itinerary" && <ItineraryList items={itinerary} />}
        {currentTab === "info" && <SharedInfo items={sharedInfo} />}
        {currentTab === "checklist" && <Checklist items={checklist} />}
      </div>
    </div>
  );
}
