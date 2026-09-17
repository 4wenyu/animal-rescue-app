-- One waiver signature may back at most one IntakeRecord. Retries of
-- POST /api/animals/intake with the same x-esign-hash replay the committed
-- row instead of minting a duplicate animal.
--
-- Postgres unique indexes allow multiple NULLs, so staff OCR batches that
-- omit a hash are unaffected.

CREATE UNIQUE INDEX IF NOT EXISTS "intake_records_esignIntentHash_key" ON "intake_records"("esignIntentHash");
