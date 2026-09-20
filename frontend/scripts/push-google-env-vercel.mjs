/**
 * Add Google OAuth env vars from frontend/.env.local to Vercel.
 * Does not print secret values. Overwrites same-named preview+production vars.
 *
 *   node scripts/push-google-env-vercel.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.join(frontendRoot, "..");
const envPath = path.join(frontendRoot, ".env.local");

const PROJECTS = ["animal-rescue-app-aheu", "animal-rescue-app"];
const KEYS = [
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "NEXT_PUBLIC_AUTH_GOOGLE_ENABLED",
];

function parseEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

const env = parseEnv(envPath);
for (const key of KEYS) {
  if (!env[key]) {
    console.error(`[push-google-env] missing ${key} in .env.local`);
    process.exit(1);
  }
}

const TARGETS = ["preview", "production"];

for (const project of PROJECTS) {
  for (const key of KEYS) {
    for (const target of TARGETS) {
      const sensitive = !key.startsWith("NEXT_PUBLIC_");
      const args = [
        "env",
        "add",
        key,
        target,
        "--force",
        "--yes",
        "--value",
        env[key],
        "--project",
        project,
        "--cwd",
        repoRoot,
      ];
      if (sensitive) args.push("--sensitive");

      const result = spawnSync("vercel", args, {
        encoding: "utf8",
        shell: true,
      });

      if (result.status !== 0) {
        const err = `${result.stderr || ""}\n${result.stdout || ""}`.trim();
        console.error(
          `[push-google-env] FAILED ${project} ${key} ${target} exit=${result.status}`,
        );
        console.error(err.slice(0, 800));
        process.exit(result.status ?? 1);
      }
      console.log(`[push-google-env] ok ${project} ${key} ${target}`);
    }
  }
}

console.log("[push-google-env] done — redeploy preview to pick up vars");
