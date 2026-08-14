-- CreateTable
CREATE TABLE "FxRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currency" TEXT NOT NULL,
    "usdPerUnit" REAL NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RateSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "mode" TEXT NOT NULL DEFAULT 'AUTO',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "FxRate_currency_source_key" ON "FxRate"("currency", "source");
