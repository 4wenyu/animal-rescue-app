-- N3: radius alerts — geocoded last-seen + helper lat/lng + draft FK
ALTER TABLE "lost_pet_searches"
  ADD COLUMN IF NOT EXISTS "lastSeenLat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lastSeenLng" DOUBLE PRECISION;

ALTER TABLE "outreach_profiles"
  ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "telegramChatId" TEXT;

CREATE INDEX IF NOT EXISTS "outreach_profiles_status_lat_lng_idx"
  ON "outreach_profiles"("status", "lat", "lng");

ALTER TABLE "outreach_drafts"
  ADD COLUMN IF NOT EXISTS "lostPetSearchId" TEXT;

CREATE INDEX IF NOT EXISTS "outreach_drafts_lostPetSearchId_idx"
  ON "outreach_drafts"("lostPetSearchId");

-- Unique only when lostPetSearchId is set (Postgres treats NULLs as distinct).
CREATE UNIQUE INDEX IF NOT EXISTS "outreach_drafts_profileId_lostPetSearchId_key"
  ON "outreach_drafts"("profileId", "lostPetSearchId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'outreach_drafts_lostPetSearchId_fkey'
  ) THEN
    ALTER TABLE "outreach_drafts"
      ADD CONSTRAINT "outreach_drafts_lostPetSearchId_fkey"
      FOREIGN KEY ("lostPetSearchId") REFERENCES "lost_pet_searches"("searchId")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
