// Prisma seed — populates MOCK_USERS + custodian Organization.
//
// NOTE: This script REQUIRES that a fresh or already-clean User table
// is the starting state. The previous "comprehensive" version using
// raw SQL template tags had cross-iteration state issues with Prisma
// 6.19.x + Node 24, and complex findUnique/update chains had a
// related bug where Prisma's stale-connection read returned the wrong
// row for `findUnique({where: {email}})`.
//
// WORKAROUND: This version uses only `prisma.user.upsert` against
// the canonical userId, with `update: {}` (no-op on update). That
// single stdlib path has proven reliable. We do not touch the email
// column after creation; an operator who needs to update an email
// can do so manually.
//
// Run from frontend/:
//   node prisma/seed.mjs

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

const CUSTODIAN_ORG = {
  orgId: "f4eedd11-2222-4000-a000-000000000001",
  orgType: "MUNICIPAL_SHELTER",
  einNumber: "00-0000000",
};

async function ensureUserOpen(u) {
  // One open upsert with no-op on update. Catches:
  //  - row missing → INSERT
  //  - row missing ONLY because of email-byteerror → still INSERT
  //  - row with our PK but someone wrote a different email → at least
  //    the canonical PK is correct
  await prisma.user.upsert({
    where: { userId: u.userId },
    update: {},
    create: u,
  });
  console.log(`    ✓ ensured ${u.email} → ${u.userId}`);
}

async function main() {
  console.log("[prisma/seed.mjs] seeding — open upsert (no-op on update)");
  for (const u of MOCK_USERS) await ensureUserOpen(u);

  await prisma.organization.upsert({
    where: { orgId: CUSTODIAN_ORG.orgId },
    update: {},
    create: CUSTODIAN_ORG,
  });
  console.log(`    ✓ ensured custodian org ${CUSTODIAN_ORG.orgId}`);

  const u = await prisma.user.findMany({
    select: { userId: true, email: true },
    orderBy: { email: "asc" },
  });
  const o = await prisma.organization.findMany({
    select: { orgId: true, orgType: true },
    orderBy: { orgId: "asc" },
  });
  console.log(`[prisma/seed.mjs] verified ${u.length} user(s), ${o.length} org(s):`);
  for (const row of u) console.log(`  ${row.email}  →  ${row.userId}`);
  for (const row of o) console.log(`  ${row.orgType}  →  ${row.orgId}`);
}

main()
  .catch((err) => {
    console.error("[prisma/seed.mjs] FAILED:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });