-- Sprint A — auth & authorization foundation.
-- Additive only: creates a new enum and two columns; no data loss.
--   passwordHash  NULL  → users created before the signup flow are not
--                         yet credential-verifiable (they must reset).
--   role          CITIZEN default → existing users (incl. the two demo
--                         rows) are demoted to CITIZEN until an admin
--                         promotes them via the seed script.

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'STAFF', 'ADMIN');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CITIZEN';
