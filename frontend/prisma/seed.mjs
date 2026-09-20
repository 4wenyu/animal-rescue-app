import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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

function requiredPassword(name) {
  const value = process.env[name];
  if (!value || value.length < 12) {
    throw new Error(`${name} must be set to a password of at least 12 characters`);
  }
  return value;
}

const USERS = [
  {
    userId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    email: "admin@rescuehub.org",
    displayName: "Admin User",
    role: "ADMIN",
    password: requiredPassword("SEED_ADMIN_PASSWORD"),
  },
  {
    userId: "a77484df-f236-407b-80a2-218f262176c4",
    email: "staff@rescuehub.org",
    displayName: "Staff User",
    role: "STAFF",
    password: requiredPassword("SEED_STAFF_PASSWORD"),
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
  console.log(`    ✓ ${user.email} (${u.role})`);
}

async function main() {
  console.log("[prisma/seed.mjs] seeding users + wallets");
  for (const u of USERS) await ensureUser(u);

  await prisma.organization.upsert({
    where: { orgId: CUSTODIAN_ORG.orgId },
    update: {},
    create: CUSTODIAN_ORG,
  });
  console.log("    ✓ custodian org");

  const dogsPath = join(dirname(fileURLToPath(import.meta.url)), "../data/dogs.json");
  const dogs = JSON.parse(readFileSync(dogsPath, "utf8"));
  for (const dog of dogs) {
    const animalId = `roster-${dog.id}`;
    const hold = Boolean(dog.statutoryHoldCleared);
    await prisma.animal.upsert({
      where: { animalId },
      update: {
        name: dog.name,
        breedDesignation: dog.breed,
        imageUrl: dog.imageUrl ?? null,
        personality: dog.personality ?? null,
        sex: dog.sex ?? null,
        ageYears: dog.age,
        statutoryHoldCleared: hold,
        listingStatus: dog.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL" ? "HOLD" : "AVAILABLE",
      },
      create: {
        animalId,
        custodianOrgId: CUSTODIAN_ORG.orgId,
        name: dog.name,
        breedDesignation: dog.breed,
        species: "Dog",
        ageYears: dog.age,
        sex: dog.sex ?? null,
        personality: dog.personality ?? null,
        imageUrl: dog.imageUrl ?? null,
        intakeTimestamp: new Date(dog.intakeTimestamp),
        strayHoldExpiresAt: dog.strayHoldExpiresAt ? new Date(dog.strayHoldExpiresAt) : null,
        statutoryHoldCleared: hold,
        medicalStatus: dog.medicalStatus === "Needs Review" ? "ISOLATION" : "HEALTHY_HOLD",
        listingStatus: dog.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL" ? "HOLD" : "AVAILABLE",
      },
    });
  }
  console.log(`    ✓ ${dogs.length} roster animals`);

  const users = await prisma.user.findMany({
    select: { email: true, role: true },
    orderBy: { email: "asc" },
  });
  console.log(`[prisma/seed.mjs] ${users.length} user(s) in this database`);
}

main()
  .catch((err) => {
    console.error("[prisma/seed.mjs] FAILED:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
