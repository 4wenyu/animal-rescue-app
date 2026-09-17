/**
 * Apply migrations + seed the DATABASE_URL from frontend/.env
 * (the same cloud Postgres Vercel uses). Passwords are written to
 * frontend/.env.preview-logins — gitignored, not printed.
 */
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.join(frontendRoot, "..");

function parseEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = {
  ...parseEnv(path.join(frontendRoot, ".env")),
  ...parseEnv(path.join(frontendRoot, ".env.local")),
};

const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL missing from frontend/.env");
}
if (/localhost|127\.0\.0\.1/i.test(databaseUrl)) {
  throw new Error("DATABASE_URL points at localhost — Vercel cannot use this");
}

const adminPassword = randomBytes(12).toString("base64url");
const staffPassword = randomBytes(12).toString("base64url");
const loginFile = path.join(frontendRoot, ".env.preview-logins");
fs.writeFileSync(
  loginFile,
  [
    "# Gitignored. Staff logins for the Vercel preview database.",
    "ADMIN_EMAIL=admin@rescuehub.org",
    `ADMIN_PASSWORD=${adminPassword}`,
    "STAFF_EMAIL=staff@rescuehub.org",
    `STAFF_PASSWORD=${staffPassword}`,
    "",
  ].join("\n"),
  { encoding: "utf8" },
);

const childEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  SEED_ADMIN_PASSWORD: adminPassword,
  SEED_STAFF_PASSWORD: staffPassword,
};

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    env: childEnv,
    encoding: "utf8",
    shell: true,
    stdio: "pipe",
  });
  const combined = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const redacted = combined.split(databaseUrl).join("[DATABASE_URL]");
  process.stdout.write(redacted);
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed (${result.status})`);
  }
}

console.log("[seed-cloud] applying migrations to cloud Postgres");
run(
  "npx",
  ["prisma", "migrate", "deploy", "--schema", path.join(repoRoot, "prisma", "schema.prisma")],
  frontendRoot,
);

console.log("[seed-cloud] seeding ADMIN/STAFF");
run("node", ["prisma/seed.mjs"], frontendRoot);

console.log("[seed-cloud] done. Open frontend/.env.preview-logins for the new passwords.");
