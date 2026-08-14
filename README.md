# KOSKALAK — Istanbul Trip Companion

A mobile-only web app for tracking a trip's spending. **Every account is a
sealed private space**: no trips, no memberships, no shared rows, no invites.
Sign-up is open, and any number of people can share one deployment without any
of them seeing anything of anyone else's.

**Turkish Lira is the currency of the app.** A cost paid in dollars, euros, or
toman keeps what was actually handed over *and* a Lira equivalent, converted at
the rate in effect when it was recorded. Every total — the budget, the charts,
the debt balance — is Lira, and none of them need the network to add up.

## Tech Stack

- Next.js 16 (App Router), React 19
- Tailwind CSS 4
- Prisma ORM 7 + SQLite (`better-sqlite3` driver adapter) — **not** Postgres
- Custom cookie-session auth signed with `jose` + `bcryptjs` — **not** NextAuth
  (see `src/lib/session.ts`, `src/lib/auth.ts`)

> Read [AGENTS.md](AGENTS.md) before touching Next.js APIs — this project
> pins a Next.js version whose conventions may differ from training data.

## Screens

| Route | What it is |
| --- | --- |
| `/` | Home — three widgets: the budget, the category pie, the category bar chart. Plus the way in to Settlement. |
| `/spending` | Two tabs: **Costs** (the feed, grouped by day) and **Settlement** (the debt ledger). The header pill follows the tab — "Add Cost" or "Add Debt". `/spending/new` adds a cost. |
| `/vault` | Three tabs: **Checklist**, **Files**, **Notes**. |
| `/exchange` | Two tabs: **Converter** and **History**. `/exchange/new` records an exchange. |
| `/me` | The budget, and the account it belongs to. |
| `/settlement` | The debt ledger on its own screen, reached from Home. Same component as the Spending tab. |

### The budget

One figure, in Lira, that **never resets** — every cost the account has ever
recorded counts against it, in any currency. It can be *entered* in any of the
four currencies; it is converted once on save and frozen, so a budget set in
dollars doesn't drift every time the market moves.

The unsettled debt balance is folded in: money owed to you raises what you have
left to spend, money you owe lowers it.

### Settlement

There is no second account behind it. It's a private ledger of what you and one
travel companion owe each other, recorded by hand, in whatever currency and
converted to Lira like everything else. Entries can be marked settled — they
stay for the record but stop counting.

It appears in two places — its own screen off Home, and the second tab on
Spending — so a debt can be logged next to the costs that prompted it. Both
render the same `DebtLedger`, which is why its composer is a controlled prop:
the "Add Debt" pill lives in the page header, outside the component.

### Vault notes

Free-form text, no title. A note is identified by what it says, so the list
shows the body rather than a name you'd have had to invent first. Editing
happens in place; deleting takes two taps.

### Vault files

Any file, no size limit. Uploads stream from the request straight to disk and
downloads stream back, so nothing ever holds a whole file in memory. Bytes live
under `VAULT_DIR` (default `./.vault`) — outside the database and outside
`public/`, so the only way to reach one is `/api/vault/file/[id]`, which checks
the session first and answers 404 for someone else's file.

Tapping a file previews it in the browser; a download button forces a download.
HTML and SVG are always served as attachments — inline they could run script
against this origin, which would be stored XSS by upload.

## Project Structure

```
src/
  app/
    (app)/            Signed-in routes, sharing one shell (BottomNav, OfflineBanner)
      page.tsx           Home — budget, pie, bar chart, settlement link
      spending/          Costs + Settlement tabs, Add Cost
      exchange/          Converter + History tabs, log an exchange
      vault/             Checklist + Files + Notes tabs
      me/                Budget, sign out
      settlement/        The debt ledger, shared with Spending's second tab
    api/vault/         Streaming file upload + authenticated file read
    auth/              Sign in / sign up (open sign-up)
  components/
    ui/                Design-system primitives (Button, Card, Field, Tabs, …)
    shell/             App chrome: BottomNav, OfflineBanner, ServiceWorkerRegistration, SignOutButton
  lib/                 Server-only data access & domain logic (one concern per file)
    auth.ts / session.ts   Who's signed in
    dashboard.ts           Home aggregate: budget, spend, debt, chart
    convert.ts             The one way an amount becomes Lira
    debts.ts / chart.ts / vault.ts
    money.ts / format.ts / constants.ts
    rates/                 Exchange-rate provider + cache
  generated/prisma/    Generated Prisma Client (gitignored, run `prisma generate`)
prisma/
  schema.prisma        Data model (see below)
  migrations/
  seed.ts              Optional: one account from .env + a rate warm-up
```

## Data Model

`prisma/schema.prisma`. Every table except `ExchangeRate` hangs off a single
`userId`, which is the only thing that grants access to a row:

- **User** — one account, one private space.
- **Expense** — a cost, in the six fixed categories (Food, Drinks, Transport,
  Activities, Shopping, Other).
- **Budget** — one per user. Stores what was typed *and* the frozen Lira value.
- **Debt** — the settlement ledger. `direction` is `THEY_OWE` or `I_OWE`;
  `settledAt` takes a row out of the balance without deleting it.
- **ChecklistItem** / **VaultFile** / **Note** — the Vault's three tabs. A
  `VaultFile` row holds metadata only; the bytes are on disk under `VAULT_DIR`.
  A `Note` is a body and nothing else — no title by design.
- **ExchangeTransaction** — an exchange actually performed, at a shop rate.
- **ExchangeRate** — cached reference rates, anchored to Toman. The one table
  with no owner: rates are public facts, not anybody's private data.

Money is **always** an integer in the currency's minor unit (never a float).
Anything entered in a non-Lira currency also carries a `baseAmountMinor` frozen
at `rateToBase`, so historical totals don't shift when today's rate moves.
Iranian currency is represented as **TOMAN** everywhere (1 Toman = 10 IRR) —
IRR never appears in the schema, API, or UI.

## Local Development

```bash
cp .env.example .env   # fill in DATABASE_URL, SESSION_SECRET
npm install             # postinstall runs `prisma generate`
npm run db:migrate      # apply migrations to ./dev.db
npm run db:seed         # optional: first account + exchange-rate warm-up
npm run dev
```

Sign-up is open, so `db:seed` is optional — you can just create an account in
the app.

Other scripts: `npm run typecheck`, `npm run lint`, `npm run db:studio`.

`dev.db` and `.vault/` are local and gitignored — never commit them.

## VPS Deployment

Designed to run on a plain Linux VPS via PM2, with the SQLite file **and the
vault directory** on persistent, backed-up paths (see `DATABASE_URL` and
`VAULT_DIR` in `.env.example`).

```bash
git clone <your-repo-url> koskalak
cd koskalak
npm install
cp .env.example .env && nano .env   # DATABASE_URL, VAULT_DIR, SESSION_SECRET, APP_URL
npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

Configure Nginx or Caddy to reverse-proxy port `3000` to your domain. If you
put a proxy in front, raise its request body limit — Nginx's
`client_max_body_size` defaults to 1MB and will reject Vault uploads long
before the app sees them.
