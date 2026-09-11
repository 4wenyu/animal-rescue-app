-- Tier 1.7 — staged opt-in outreach (OutreachProfile + OutreachDraft).
--
-- NOTE ON DEPLOY PREREQUISITE: this repo's migration history does not
-- contain the pre-sprint base schema (the `users` table etc. predate the
-- migrations directory — sprint_a only ALTERs `users`). A fresh environment
-- MUST run `prisma db push` first (the documented deploy flow for this repo)
-- and THEN `prisma migrate deploy` for the incremental history. This
-- migration only owns the outreach delta; on the live database it was
-- recorded as applied (db push already created these objects).

-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('ACTIVE', 'PAUSED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "OutreachDraftStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'SKIPPED');

-- CreateEnum
CREATE TYPE "OutreachHelpArea" AS ENUM ('DONATE', 'FOSTER', 'ADOPT', 'VOLUNTEER', 'SHARE', 'TRANSPORT');

-- CreateTable
CREATE TABLE "outreach_profiles" (
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OutreachStatus" NOT NULL DEFAULT 'ACTIVE',
    "helpAreas" "OutreachHelpArea"[],
    "regionLabel" TEXT,
    "consentGiven" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribeToken" TEXT NOT NULL,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_profiles_pkey" PRIMARY KEY ("profileId")
);

-- CreateTable
CREATE TABLE "outreach_drafts" (
    "draftId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OutreachDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "animalId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "helpAsk" "OutreachHelpArea" NOT NULL,
    "sourceNote" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_drafts_pkey" PRIMARY KEY ("draftId")
);

-- CreateIndex
CREATE UNIQUE INDEX "outreach_profiles_userId_key" ON "outreach_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "outreach_profiles_unsubscribeToken_key" ON "outreach_profiles"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "outreach_profiles_status_updatedAt_idx" ON "outreach_profiles"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "outreach_drafts_status_createdAt_idx" ON "outreach_drafts"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "outreach_profiles" ADD CONSTRAINT "outreach_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "outreach_profiles"("profileId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
