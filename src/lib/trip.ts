import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, type SessionUser } from "@/lib/auth";
import { asCurrency, type CurrencyCode } from "@/lib/money";

/**
 * Trip-scoped data access.
 *
 * This is a single-trip app, so there is exactly one Trip row and both users
 * are members of it. Everything that reads shared data goes through
 * `requireTripContext`, which proves membership before any query runs — a
 * request can't reach trip data by guessing an id.
 */

export type TripContext = {
  user: SessionUser;
  trip: {
    id: string;
    name: string;
    emoji: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    baseCurrency: CurrencyCode;
    budgetMinor: number;
  };
  /** The other traveler. Null until the second account exists. */
  partner: { id: string; name: string } | null;
};

export const getActiveTrip = cache(async () => {
  return prisma.trip.findFirst({ orderBy: { createdAt: "asc" } });
});

/**
 * Resolves the signed-in user, the trip, and the other traveler in one go.
 * Redirects rather than throwing so pages can call it directly.
 */
export const requireTripContext = cache(async (): Promise<TripContext> => {
  const user = await requireUser();
  const trip = await getActiveTrip();

  if (!trip) redirect("/setup");

  const members = await prisma.tripMember.findMany({
    where: { tripId: trip.id },
    select: { userId: true, user: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const isMember = members.some((member) => member.userId === user.id);
  if (!isMember) redirect("/setup");

  const partner = members.find((member) => member.userId !== user.id)?.user ?? null;

  return {
    user,
    trip: {
      id: trip.id,
      name: trip.name,
      emoji: trip.emoji,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      baseCurrency: asCurrency(trip.baseCurrency),
      budgetMinor: trip.budgetMinor,
    },
    partner,
  };
});

/**
 * Membership check for route handlers and server actions, which should return
 * a 401/error rather than redirect. Returns null when the caller has no
 * business touching this trip.
 */
export async function getTripContextOrNull(): Promise<TripContext | null> {
  const { getCurrentUser } = await import("@/lib/auth");
  const user = await getCurrentUser();
  if (!user) return null;

  const trip = await getActiveTrip();
  if (!trip) return null;

  const members = await prisma.tripMember.findMany({
    where: { tripId: trip.id },
    select: { userId: true, user: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  if (!members.some((member) => member.userId === user.id)) return null;

  return {
    user,
    trip: {
      id: trip.id,
      name: trip.name,
      emoji: trip.emoji,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      baseCurrency: asCurrency(trip.baseCurrency),
      budgetMinor: trip.budgetMinor,
    },
    partner: members.find((member) => member.userId !== user.id)?.user ?? null,
  };
}

/**
 * The visibility rule for expenses, in one place: shared expenses belong to
 * the trip, private ones belong only to the person who recorded them.
 *
 * Spread this into every expense `where` clause. Doing the filtering in SQL —
 * rather than fetching everything and hiding rows in the UI — is what keeps
 * private spending genuinely private.
 */
export function expenseVisibility(tripId: string, userId: string) {
  return {
    tripId,
    OR: [{ isShared: true }, { isShared: false, paidById: userId }],
  };
}
