// Prisma seed: ensure the MOCK_USERS from app/api/[...nextauth]/auth.ts exist
// in the User table before any /api/tokens/transaction request runs.
//
// Idempotent: re-running wipes any prior admin@/staff@rescuehub.org rows and
// re-inserts the two canonical v4-UUID users. Knowledge cutoff for prior
// bug note: an earlier draft used a sentinel + per-row migration loop that
// had a cross-iteration ordering bug; this script avoids that entirely by
// going straight to delete-then-create.
//
// Run from frontend/:
//   node prisma/seed.mjs
//
// IMPORTANT: This wipes any TokenTransactions/Wallets tied to the mock
// userIds. Do not run in an environment with real token data.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MOCK_USERS = [
  {
    userId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    email: "[email protected]",
    displayName: "Admin User",
    marketingOptIn: false,
  },
  {
    userId: "a77484df-f236-407b-80a2-218f262176c4",
    email: "[email protected]",
    displayName: "Staff User",
    marketingOptIn: false,
  },
];

async function main() {
  console.log("[prisma/seed.mjs] seeding MOCK_USERS into public.users…");

  console.log("  deleting prior mock-user dependents (token ledger / shares)");
  await prisma.tokenTransaction.deleteMany({
    where: { userId: { in: MOCK_USERS.map((m) => m.userId) } },
  });
  await prisma.tokenWallet.deleteMany({
    where: { userId: { in: MOCK_USERS.map((m) => m.userId) } },
  });

  console.log("  deleting pre-existing mock-user rows by email");
  await prisma.user.deleteMany({
    where: { email: { in: MOCK_USERS.map((m) => m.email) } },
  });

  console.log("  inserting canonical rows (sequential, per-row)");
  for (const u of MOCK_USERS) {
    await prisma.user.create({
      data: {
        userId: u.userId,
        email: u.email,
        displayName: u.displayName,
        marketingOptIn: u.marketingOptIn,
      },
    });
    console.log(`    ✓ ${u.email} → ${u.userId}`);
  }

  console.log("[prisma/seed.mjs] verify state:");
  const rows = await prisma.user.findMany({
    where: { email: { in: MOCK_USERS.map((m) => m.email) } },
    select: { userId: true, email: true },
    orderBy: { email: "asc" },
  });
  for (const r of rows) {
    console.log(`  ${r.email}  →  ${r.userId}`);
  }
  console.log(`[prisma/seed.mjs] done (${rows.length} row(s) in Neon).`);
}

main()
  .catch((err) => {
    console.error("[prisma/seed.mjs] FAILED:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });