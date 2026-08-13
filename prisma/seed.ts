/**
 * Optional first-run setup.
 *
 * There is nothing to seed for the app to work — sign-up is open, and a new
 * account starts with an empty private space. This script only does two
 * conveniences:
 *
 *   1. Creates one account from SEED_USER_* if those are set, so a fresh
 *      deployment can be signed into without using the sign-up form.
 *   2. Warms the exchange-rate cache, so the first page load has a reference
 *      price even if the provider is unreachable.
 *
 * Idempotent: re-running it will not duplicate anything and will never reset a
 * password that was changed later.
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

const STARTER_CHECKLIST = [
  "Exchange USD",
  "Buy Istanbulkart",
  "Get SIM / eSIM",
  "Airport transfer",
  "Check hotel booking",
  "Buy souvenirs",
];

async function seedUser() {
  const name = process.env.SEED_USER_NAME;
  const email = process.env.SEED_USER_EMAIL?.toLowerCase();
  const password = process.env.SEED_USER_PASSWORD;

  if (!name || !email || !password) {
    console.log("• SEED_USER_* not set — skipping account creation (sign up in the app)");
    return;
  }

  if (password.length < 8) {
    throw new Error("SEED_USER_PASSWORD must be at least 8 characters");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    console.log(`• Account <${email}> already exists — left untouched`);
    return;
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
    select: { id: true },
  });

  await prisma.checklistItem.createMany({
    data: STARTER_CHECKLIST.map((title, index) => ({
      userId: user.id,
      title,
      sortOrder: index,
    })),
  });

  console.log(`✓ Account ${name} <${email}> with a ${STARTER_CHECKLIST.length}-item checklist`);
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

    const body = (await response.json()) as {
      currency?: { symbol?: string; price?: number }[];
    };
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

    // Toman anchors the table at 1 by definition.
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

async function main() {
  await seedUser();
  await warmRates();
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
