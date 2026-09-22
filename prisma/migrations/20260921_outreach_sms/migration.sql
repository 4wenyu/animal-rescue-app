-- Staff-gated helper SMS (Twilio). Opt-in phone only; no cold texts.
ALTER TABLE "outreach_profiles"
  ADD COLUMN IF NOT EXISTS "phoneE164" TEXT;
