# KOSKALAK - Istanbul Trip Companion

A mobile-only web application built to manage a 2-person trip to Istanbul.
Track shared and personal budgets, manage itineraries, convert currency, and safely store private documents.

## Tech Stack
- Next.js (App Router)
- React, Tailwind CSS
- Prisma ORM + PostgreSQL
- NextAuth.js

## VPS Deployment Instructions

This application is designed to be deployed to a standard Linux VPS using PM2.

### 1. Prerequisites
- Node.js (v18+)
- PM2 (`npm install -g pm2`)
- A PostgreSQL database (can be local on the VPS or hosted like Neon/Supabase)

### 2. Setup

Clone the repository to your VPS:
```bash
git clone <your-repo-url> koskalak
cd koskalak
npm install
```

Copy the example environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure your `DATABASE_URL` and `NEXTAUTH_SECRET`:
```bash
nano .env
```

### 3. Database Migration
Apply the schema to your PostgreSQL database:
```bash
npx prisma migrate deploy
```

### 4. Build
Build the Next.js production app:
```bash
npm run build
```

### 5. Start with PM2
Start the application using the provided ecosystem config:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Your KOSKALAK instance is now running in the background! Configure Nginx or Caddy to reverse-proxy port `3000` to your domain.

## Project Structure
- `/src/app/` - Next.js Pages and Layouts (Home, Spending, Trip, Exchange, Me, Auth)
- `/src/components/` - Shared UI components like `BottomNav`
- `/src/lib/` - Utilities (Currency API client, Prisma instance, NextAuth config)
- `prisma/schema.prisma` - Database structure for Users, Trips, Expenses, and Private Vault.
