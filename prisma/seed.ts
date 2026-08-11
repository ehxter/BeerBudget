/**
 * Creates the trip and the two traveler accounts from .env.
 *
 * Idempotent: re-running it will not duplicate anything and will not clobber a
 * trip that already exists. Safe to run on the VPS after every deploy.
 *
 *   npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const DECIMALS: Record<string, number> = { TRY: 2, USD: 2, EUR: 2, TOMAN: 0 };

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — see .env.example`);
  return value;
}

function toMinor(major: number, currency: string): number {
  return Math.round(major * 10 ** (DECIMALS[currency] ?? 2));
}

function parseDate(value: string, name: string): Date {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${name} is not a valid date (expected YYYY-MM-DD): ${value}`);
  }
  return date;
}

const STARTER_CHECKLIST = [
  "Exchange USD",
  "Buy Istanbulkart",
  "Get SIM / eSIM",
  "Airport transfer",
  "Check hotel booking",
  "Buy souvenirs",
];

async function upsertUser(nameKey: string, emailKey: string, passwordKey: string) {
  const name = required(nameKey);
  const email = required(emailKey).toLowerCase();
  const password = required(passwordKey);

  if (password.length < 8) {
    throw new Error(`${passwordKey} must be at least 8 characters`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Only set the password on create — re-seeding must not silently reset a
  // password the traveler changed later.
  const user = await prisma.user.upsert({
    where: { email },
    create: { name, email, passwordHash },
    update: { name },
  });

  return user;
}

async function main() {
  const baseCurrency = process.env.SEED_TRIP_BASE_CURRENCY ?? "TRY";
  if (!DECIMALS[baseCurrency]) {
    throw new Error(`SEED_TRIP_BASE_CURRENCY must be one of TRY, USD, EUR, TOMAN`);
  }

  const user1 = await upsertUser(
    "SEED_USER1_NAME",
    "SEED_USER1_EMAIL",
    "SEED_USER1_PASSWORD",
  );
  const user2 = await upsertUser(
    "SEED_USER2_NAME",
    "SEED_USER2_EMAIL",
    "SEED_USER2_PASSWORD",
  );

  if (user1.id === user2.id) {
    throw new Error("The two travelers must have different email addresses");
  }

  console.log(`✓ Users: ${user1.name} <${user1.email}>, ${user2.name} <${user2.email}>`);

  let trip = await prisma.trip.findFirst({ orderBy: { createdAt: "asc" } });

  if (trip) {
    console.log(`• Trip "${trip.name}" already exists — left unchanged`);
  } else {
    const budgetMajor = Number(required("SEED_TRIP_BUDGET"));
    if (!Number.isFinite(budgetMajor) || budgetMajor < 0) {
      throw new Error("SEED_TRIP_BUDGET must be a non-negative number");
    }

    const startDate = parseDate(required("SEED_TRIP_START"), "SEED_TRIP_START");
    const endDate = parseDate(required("SEED_TRIP_END"), "SEED_TRIP_END");
    if (endDate < startDate) {
      throw new Error("SEED_TRIP_END must be on or after SEED_TRIP_START");
    }

    trip = await prisma.trip.create({
      data: {
        name: required("SEED_TRIP_NAME"),
        emoji: process.env.SEED_TRIP_EMOJI ?? "🕌",
        destination: process.env.SEED_TRIP_DESTINATION ?? "Istanbul, Turkey",
        startDate,
        endDate,
        baseCurrency,
        budgetMinor: toMinor(budgetMajor, baseCurrency),
      },
    });

    console.log(
      `✓ Trip "${trip.name}" — ${trip.destination}, ` +
        `${startDate.toDateString()} → ${endDate.toDateString()}, ` +
        `budget ${budgetMajor.toLocaleString()} ${baseCurrency}`,
    );
  }

  for (const user of [user1, user2]) {
    await prisma.tripMember.upsert({
      where: { userId_tripId: { userId: user.id, tripId: trip.id } },
      create: { userId: user.id, tripId: trip.id },
      update: {},
    });
  }
  console.log("✓ Both travelers are members of the trip");

  const checklistCount = await prisma.checklistItem.count({ where: { tripId: trip.id } });
  if (checklistCount === 0) {
    await prisma.checklistItem.createMany({
      data: STARTER_CHECKLIST.map((title, index) => ({
        tripId: trip.id,
        title,
        sortOrder: index,
      })),
    });
    console.log(`✓ Starter checklist (${STARTER_CHECKLIST.length} items)`);
  }

  // Warm the exchange-rate cache so the app has a reference price on first
  // load even if the provider is unreachable later. Best effort only.
  await warmRates();
}

async function warmRates() {
  const key = process.env.BRSAPI_KEY;
  if (!key) {
    console.log("• BRSAPI_KEY not set — skipping rate warm-up");
    return;
  }

  try {
    const url = new URL(
      process.env.BRSAPI_URL ?? "https://Api.BrsApi.ir/Market/Gold_Currency.php",
    );
    url.searchParams.set("key", key);

    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const body = (await response.json()) as { currency?: { symbol?: string; price?: number }[] };
    const wanted: Record<string, string> = { USD: "USD", EUR: "EUR", TRY: "TRY" };
    const fetchedAt = new Date();

    let count = 0;
    for (const entry of body.currency ?? []) {
      const currency = entry.symbol ? wanted[entry.symbol] : undefined;
      const price = Number(entry.price);
      if (!currency || !Number.isFinite(price) || price <= 0) continue;

      await prisma.exchangeRate.upsert({
        where: { currency_source: { currency, source: "BRSAPI" } },
        create: { currency, source: "BRSAPI", tomanPerUnit: price, fetchedAt },
        update: { tomanPerUnit: price, fetchedAt },
      });
      count += 1;
    }

    await prisma.exchangeRate.upsert({
      where: { currency_source: { currency: "TOMAN", source: "BRSAPI" } },
      create: { currency: "TOMAN", source: "BRSAPI", tomanPerUnit: 1, fetchedAt },
      update: { tomanPerUnit: 1, fetchedAt },
    });

    console.log(`✓ Cached reference rates for ${count} currencies`);
  } catch (error) {
    console.log(
      `• Rate warm-up skipped (${error instanceof Error ? error.message : error}) — ` +
        "the app will retry in the background",
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("\nSeed complete. Sign in at /auth/signin");
  })
  .catch(async (error) => {
    console.error("\nSeed failed:", error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
