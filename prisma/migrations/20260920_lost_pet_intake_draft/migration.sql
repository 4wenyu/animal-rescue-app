-- N1: server-side lost-pet intake drafts (one active draft per user)
CREATE TABLE IF NOT EXISTS "lost_pet_intake_drafts" (
    "draftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "accumulated" JSONB NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lost_pet_intake_drafts_pkey" PRIMARY KEY ("draftId")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lost_pet_intake_drafts_userId_key" ON "lost_pet_intake_drafts"("userId");

ALTER TABLE "lost_pet_intake_drafts"
  ADD CONSTRAINT "lost_pet_intake_drafts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("userId")
  ON DELETE CASCADE ON UPDATE CASCADE;
