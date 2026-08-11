"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTripContext } from "@/lib/trip";
import { revalidatePath } from "next/cache";
import { parseAmountToMinor, type CurrencyCode } from "@/lib/money";
import { fromDateInputValue } from "@/lib/format";
import { ITINERARY_CATEGORIES, PLACE_CATEGORIES, valuesOf } from "@/lib/constants";
import { z } from "zod";

export type EventFormState = { error?: string };

const eventSchema = z.object({
  title: z.string().trim().min(1, "Give it a title").max(120),
  day: z.string(),
  startTime: z.string().optional(),
  location: z.string().trim().max(160).optional(),
  category: z.enum(valuesOf(ITINERARY_CATEGORIES)),
  estimatedCost: z.string().optional(),
  estimatedCostCurrency: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function addItineraryItem(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const { trip } = await requireTripContext();

  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  const day = fromDateInputValue(parsed.data.day);
  if (!day) return { error: "Enter a valid date" };

  const currency = (parsed.data.estimatedCostCurrency || trip.baseCurrency) as CurrencyCode;
  const estimatedCostMinor = parsed.data.estimatedCost
    ? parseAmountToMinor(parsed.data.estimatedCost, currency)
    : null;

  await prisma.itineraryItem.create({
    data: {
      tripId: trip.id,
      title: parsed.data.title,
      day,
      startTime: parsed.data.startTime || null,
      location: parsed.data.location || null,
      category: parsed.data.category,
      estimatedCostMinor,
      estimatedCostCurrency: estimatedCostMinor ? currency : null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/trip");
  redirect("/trip");
}

export async function toggleChecklistItem(id: string, isDone: boolean) {
  const { user } = await requireTripContext();
  await prisma.checklistItem.update({
    where: { id },
    data: {
      isDone,
      completedById: isDone ? user.id : null,
      completedAt: isDone ? new Date() : null,
    },
  });
  revalidatePath("/trip");
}

export type ActionState = { error?: string; ok?: boolean };

export async function addChecklistItem(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { trip } = await requireTripContext();
  const title = formData.get("title")?.toString().trim();
  
  if (!title) return { error: "Title is required" };

  await prisma.checklistItem.create({
    data: {
      tripId: trip.id,
      title,
    },
  });

  revalidatePath("/trip");
  return { ok: true };
}

/**
 * Wishlist → Agenda, the action behind the Figma "Move to Agenda" button.
 * Creates a real itinerary item from the place and marks the place planned,
 * so it drops out of the Wishlist list and shows up as a scheduled event.
 */
export async function movePlaceToAgenda(formData: FormData): Promise<void> {
  const { trip } = await requireTripContext();
  const placeId = formData.get("placeId");
  if (typeof placeId !== "string") return;

  const place = await prisma.place.findFirst({
    where: { id: placeId, tripId: trip.id },
  });
  if (!place) return;

  await prisma.$transaction([
    prisma.itineraryItem.create({
      data: {
        tripId: trip.id,
        title: place.name,
        day: trip.startDate,
        location: place.address,
        category: mapPlaceCategoryToItinerary(place.category),
        estimatedCostMinor: place.estimatedPriceMinor,
        estimatedCostCurrency: place.estimatedPriceCurrency,
        placeId: place.id,
      },
    }),
    prisma.place.update({ where: { id: place.id }, data: { status: "PLANNED" } }),
  ]);

  revalidatePath("/trip");
}

const placeSchema = z.object({
  name: z.string().trim().min(1, "Give it a name").max(120),
  category: z.enum(valuesOf(PLACE_CATEGORIES)),
  address: z.string().trim().max(200).optional(),
  mapUrl: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
  estimatedPrice: z.string().optional(),
  estimatedPriceCurrency: z.string().optional(),
});

export async function addPlace(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const { trip } = await requireTripContext();

  const parsed = placeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  const currency = (parsed.data.estimatedPriceCurrency || trip.baseCurrency) as CurrencyCode;
  const estimatedPriceMinor = parsed.data.estimatedPrice
    ? parseAmountToMinor(parsed.data.estimatedPrice, currency)
    : null;

  await prisma.place.create({
    data: {
      tripId: trip.id,
      name: parsed.data.name,
      category: parsed.data.category,
      address: parsed.data.address || null,
      mapUrl: parsed.data.mapUrl || null,
      notes: parsed.data.notes || null,
      estimatedPriceMinor,
      estimatedPriceCurrency: estimatedPriceMinor ? currency : null,
    },
  });

  revalidatePath("/trip");
  redirect("/trip?tab=wishlist");
}

function mapPlaceCategoryToItinerary(placeCategory: string): string {
  switch (placeCategory) {
    case "RESTAURANT":
    case "CAFE":
      return "FOOD";
    case "SHOPPING":
      return "SHOPPING";
    case "ATTRACTION":
    case "ACTIVITY":
    case "NEIGHBORHOOD":
      return "ACTIVITY";
    default:
      return "OTHER";
  }
}
