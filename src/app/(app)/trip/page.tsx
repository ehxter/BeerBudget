import { requireTripContext } from "@/lib/trip";
import { prisma } from "@/lib/prisma";
import { Screen, ButtonLink, TabSwitcher, SectionHeader } from "@/components/ui";
import { AgendaList } from "./AgendaList";
import { WishlistList } from "./WishlistList";
import { Checklist } from "./Checklist";
import { SharedInfo } from "./SharedInfo";

export const metadata = { title: "Trip · Istanbul" };
export const dynamic = "force-dynamic";

/**
 * Trip, from the Figma "Home" (Agenda) and "Home — Wishlist" frames — the
 * layer names weren't updated when the file was renamed, but the bottom nav
 * and content confirm this is Trip. The design shows only an Agenda/Wishlist
 * segmented pair; Checklist and Shared Info have no Figma reference, so they
 * sit below as their own stacked sections rather than inventing a third tab.
 */
export default async function TripPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { trip } = await requireTripContext();
  const { tab } = await searchParams;
  const currentTab = tab ?? "agenda";

  const [itinerary, places, checklist, sharedInfo] = await Promise.all([
    prisma.itineraryItem.findMany({
      where: { tripId: trip.id, day: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      orderBy: [{ day: "asc" }, { sortOrder: "asc" }, { startTime: "asc" }],
    }),
    prisma.place.findMany({
      where: { tripId: trip.id, status: { not: "VISITED" } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.checklistItem.findMany({
      where: { tripId: trip.id },
      orderBy: { sortOrder: "asc" },
      include: { completedBy: { select: { name: true } } },
    }),
    prisma.sharedInfo.findMany({
      where: { tripId: trip.id },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <Screen
      trip={{ emoji: trip.emoji, name: trip.name }}
      gap={4}
      className="animate-rise"
      action={
        currentTab === "wishlist" ? (
          <ButtonLink href="/trip/places/new">Add Place</ButtonLink>
        ) : (
          <ButtonLink href="/trip/itinerary/new">Add Event</ButtonLink>
        )
      }
    >
      <TabSwitcher
        name="tab"
        defaultValue="agenda"
        options={[
          { value: "agenda", label: "Agenda" },
          { value: "wishlist", label: "Wishlist" },
        ]}
      />

      <div className="animate-fade-in flex flex-col gap-4">
        {currentTab === "agenda" ? <AgendaList items={itinerary} /> : null}
        {currentTab === "wishlist" ? <WishlistList places={places} /> : null}
      </div>

      {/* Checklist renders its own "Checklist · X of Y done" header. */}
      <section className="flex flex-col gap-2.5 pt-4">
        <Checklist items={checklist} />
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionHeader label="Trip info" />
        <SharedInfo items={sharedInfo} />
      </section>
    </Screen>
  );
}
