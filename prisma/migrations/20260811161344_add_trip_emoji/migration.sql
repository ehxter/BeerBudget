-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🕌',
    "destination" TEXT NOT NULL DEFAULT 'Istanbul, Turkey',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'TRY',
    "budgetMinor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Trip" ("baseCurrency", "budgetMinor", "createdAt", "destination", "endDate", "id", "name", "startDate") SELECT "baseCurrency", "budgetMinor", "createdAt", "destination", "endDate", "id", "name", "startDate" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
