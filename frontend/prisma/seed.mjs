// Prisma seed — creates the two pilot users (ADMIN/STAFF) with correct
// emails, real scrypt-hashed passwords, roles, and ACTIVE token wallets,
// plus the custodian Organization.
//
// Hash format matches lib/auth/password.ts: scrypt$N$r$p$salt$digest
// (base64url). Verify any tweaked cost params against that module.
//
// Demo credentials (change before any public launch):
//   admin@rescuehub.org / admin123   → ADMIN
//   staff@rescuehub.org / staff123   → STAFF
//
// Run from frontend/:
//   node prisma/seed.mjs

import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const scrypt = promisify(_scrypt);
const prisma = new PrismaClient();

const N = 32768;
const r = 8;
const p = 1;
const KEYLEN = 64;

async function hash(plain) {
  const salt = randomBytes(16);
  const digest = await scrypt(plain, salt, KEYLEN, {
    N,
    r,
    p,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64url")}$${digest.toString("base64url")}`;
}

const USERS = [
  {
    userId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    email: "admin@rescuehub.org",
    displayName: "Admin User",
    role: "ADMIN",
    password: "admin123",
  },
  {
    userId: "a77484df-f236-407b-80a2-218f262176c4",
    email: "staff@rescuehub.org",
    displayName: "Staff User",
    role: "STAFF",
    password: "staff123",
  },
];

const CUSTODIAN_ORG = {
  orgId: "f4eedd11-2222-4000-a000-000000000001",
  orgType: "MUNICIPAL_SHELTER",
  einNumber: "00-0000000",
};

async function ensureUser(u) {
  const passwordHash = await hash(u.password);
  const user = await prisma.user.upsert({
    where: { userId: u.userId },
    update: { email: u.email, displayName: u.displayName, role: u.role, passwordHash },
    create: {
      userId: u.userId,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      passwordHash,
      marketingOptIn: false,
    },
  });
  await prisma.tokenWallet.upsert({
    where: { userId: u.userId },
    update: {},
    create: {
      userId: u.userId,
      cachedBalance: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      lifetimeExpired: 0,
      status: "ACTIVE",
    },
  });
  console.log(`    ✓ ${user.email} (${u.role}) → ${u.userId}`);
}

async function main() {
  console.log("[prisma/seed.mjs] seeding users w/ hashed credentials + wallets");
  for (const u of USERS) await ensureUser(u);

  await prisma.organization.upsert({
    where: { orgId: CUSTODIAN_ORG.orgId },
    update: {},
    create: CUSTODIAN_ORG,
  });
  console.log(`    ✓ custodian org ${CUSTODIAN_ORG.orgId}`);

  const users = await prisma.user.findMany({
    select: { userId: true, email: true, role: true },
    orderBy: { email: "asc" },
  });
  console.log(`[prisma/seed.mjs] verified ${users.length} user(s):`);
  for (const row of users) console.log(`  ${row.email} (${row.role}) → ${row.userId}`);
}

main()
  .catch((err) => {
    console.error("[prisma/seed.mjs] FAILED:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
