-- N4: idempotent Stripe checkout fulfillments
CREATE TABLE IF NOT EXISTS "fundraising_donations" (
    "donationId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "rosterId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "allocation" "FundType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fundraising_donations_pkey" PRIMARY KEY ("donationId")
);

CREATE UNIQUE INDEX IF NOT EXISTS "fundraising_donations_stripeSessionId_key"
  ON "fundraising_donations"("stripeSessionId");

CREATE INDEX IF NOT EXISTS "fundraising_donations_animalId_createdAt_idx"
  ON "fundraising_donations"("animalId", "createdAt");
