/**
 * Probe LLM gateways from frontend/.env.local without printing secrets.
 * Usage: npm run llm:probe
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(frontendRoot, ".env.local");

function parseEnv(file) {
  if (!fs.existsSync(file)) return null;
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

function present(env, name) {
  const value = env[name]?.trim();
  return Boolean(value);
}

function maskLen(env, name) {
  const value = env[name]?.trim() ?? "";
  return value ? `present (len ${value.length})` : "unset";
}

function normalizeTeamoBaseUrl(raw) {
  const fallback = "https://api.teamorouter.com/v1";
  if (!raw?.trim()) return fallback;
  let url = raw.trim().replace(/\/+$/, "");
  url = url.replace(
    /^(https?:\/\/)api\.teamorouter\.cc\b/i,
    "$1api.teamorouter.com",
  );
  if (!/\/v1$/i.test(url)) url = `${url}/v1`;
  return url;
}

async function fetchStatus(url, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    let extra = "";
    try {
      const json = await res.json();
      if (Array.isArray(json?.data)) extra = ` models=${json.data.length}`;
      else if (json?.error?.message) extra = ` error=${String(json.error.message).slice(0, 80)}`;
    } catch {
      extra = "";
    }
    return `${res.status}${extra}`;
  } catch (err) {
    const code = err?.cause?.code || err?.name || "ERR";
    return `FAIL ${code}`;
  } finally {
    clearTimeout(timer);
  }
}

async function probeModels(baseUrl, apiKey) {
  const url = `${baseUrl.replace(/\/+$/, "")}/models`;
  return fetchStatus(url, { Authorization: `Bearer ${apiKey}` });
}

console.log("RescueHub LLM probe (never prints key values)\n");

console.log("Public hosts (no keys):");
for (const host of [
  "https://api.teamorouter.cc/v1/models",
  "https://api.teamorouter.com/v1/models",
]) {
  console.log(`  ${host} → ${await fetchStatus(host)}`);
}

const env = parseEnv(envPath);
if (!env) {
  console.log(`\n${path.relative(process.cwd(), envPath)} is missing.`);
  console.log(
    "Copy frontend/.env.example → frontend/.env.local on the machine that has the keys, then rerun.",
  );
  process.exit(2);
}

console.log(`\n${path.relative(process.cwd(), envPath)} loaded (names only):`);
for (const name of [
  "TEAMOROUTER_API_KEY",
  "TEAMOROUTER_BASE_URL",
  "TEAMOROUTER_MODEL",
  "FREELLMAPI_API_KEY",
  "FREELLMAPI_BASE_URL",
  "FREELLMAPI_MODEL",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "DATABASE_URL",
]) {
  console.log(`  ${name}: ${maskLen(env, name)}`);
}

let ok = 0;
let tried = 0;

if (present(env, "TEAMOROUTER_API_KEY")) {
  tried += 1;
  const base = normalizeTeamoBaseUrl(env.TEAMOROUTER_BASE_URL);
  const result = await probeModels(base, env.TEAMOROUTER_API_KEY);
  console.log(`\nTeamoRouter GET ${base}/models → ${result}`);
  if (result.startsWith("200")) ok += 1;
}

if (present(env, "FREELLMAPI_API_KEY")) {
  tried += 1;
  const base = (env.FREELLMAPI_BASE_URL || "http://localhost:3001/v1").replace(
    /\/+$/,
    "",
  );
  const result = await probeModels(base, env.FREELLMAPI_API_KEY);
  console.log(`\nFreeLLMAPI GET ${base}/models → ${result}`);
  if (result.startsWith("200")) ok += 1;
}

if (present(env, "GOOGLE_GENERATIVE_AI_API_KEY")) {
  tried += 1;
  console.log(
    "\nGemini key is present. Not calling generateContent from this probe (saves quota).",
  );
}

if (tried === 0) {
  console.log("\nNo TEAMOROUTER_API_KEY / FREELLMAPI_API_KEY / Gemini key set.");
  process.exit(2);
}

process.exit(ok > 0 ? 0 : 1);
