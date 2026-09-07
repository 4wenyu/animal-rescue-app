// Sync the outreach (Tier 1.7) i18n section into all 7 locale files.
// Plain Node: writes JSON.stringify(d, null, 2) + "\n" with no BOM.
const fs = require("fs");
const path = require("path");

const LOCALES = ["en", "es", "zh-CN", "zh-TW", "ja", "ko", "zh"];

const SECTION = {
  title: "I can help",
  body: "Tell the outreach agent how you can help — donation, fostering, adoption, volunteering, sharing, or transport. This is the explicit opt-in: without it, the agent never contacts anyone.",
  help_areas_label: "How can you help?",
  area_donate: "Donate",
  area_foster: "Foster",
  area_adopt: "Adopt",
  area_volunteer: "Volunteer",
  area_share: "Share",
  area_transport: "Transport",
  region_label: "Your area (city / zip)",
  region_placeholder: "e.g. Springfield, 62701",
  error_none: "Pick at least one way you can help.",
  saving: "Saving…",
  cta: "Opt in to outreach",
  success: "You're on the list!",
  token_hint: "Save this one-click unsubscribe token — you can leave outreach at any time.",
  copied: "Copied!",
  copy: "Copy",
  review_title: "Outreach review queue",
  review_pending: "pending",
  review_empty: "No outreach drafts yet. Run the agent to generate drafts.",
  review_approve: "Approve & send",
  review_skip: "Skip",
  agent_run: "Run the agent",
  agent_running: "Running…",
};

// Keep the same keys for all locales (English fallback) to preserve parity.
// Translators can refine later; structural parity is what matters for the MVP.
const dir = path.join(__dirname, "..", "locales");
let failures = 0;
for (const loc of LOCALES) {
  const file = path.join(dir, `${loc}.json`);
  let d;
  try {
    d = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`FAIL read ${loc}:`, e.message);
    failures++;
    continue;
  }
  d.outreach = { ...(d.outreach || {}), ...SECTION };
  fs.writeFileSync(file, (JSON.stringify(d, null, 2) + "\n").replace(/^\uFEFF/, ""), "utf8");
  console.log(`OK ${loc}.outreach synced (${Object.keys(d.outreach).length} keys)`);
}
console.log(failures === 0 ? "ALL LOCALES OK" : `FAILURES: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
