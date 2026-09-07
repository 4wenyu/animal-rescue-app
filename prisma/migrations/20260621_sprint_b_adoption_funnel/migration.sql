-- Sprint B — adoption funnel lead rows.
-- Additive only: creates a single new table; no data loss, no changes to
-- existing columns or enums.

-- CreateTable
CREATE TABLE "adoption_interests" (
    "interestId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "animalName" TEXT NOT NULL,
    "interestType" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adoption_interests_pkey" PRIMARY KEY ("interestId")
);

-- CreateIndex
CREATE INDEX "adoption_interests_animalId_idx" ON "adoption_interests"("animalId");

-- CreateIndex
CREATE INDEX "adoption_interests_status_createdAt_idx" ON "adoption_interests"("status", "createdAt");
