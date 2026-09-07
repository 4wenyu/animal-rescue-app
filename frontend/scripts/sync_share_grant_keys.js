// Sync new Tier 1.6 radar share-grant i18n keys into all locale files.
// Runs with plain Node (fs), writes JSON.stringify(d, null, 2) + "\n" (no BOM).
const fs = require("fs");
const path = require("path");

const LOCALES = ["en", "es", "zh-CN", "zh-TW", "ja", "ko", "zh"];
const NEW_KEYS = {
  share_claim: "Claim free search",
  share_claiming: "Claiming…",
  share_granted: "Free search granted! Balance: {balance} tokens",
  share_already_granted: "Free search already claimed.",
};

// Per-locale translations (fall back to English if a locale is missing).
const TRANSLATIONS = {
  en: NEW_KEYS,
  es: {
    share_claim: "Reclamar búsqueda gratuita",
    share_claiming: "Reclamando…",
    share_granted: "¡Búsqueda gratuita concedida! Saldo: {balance} tokens",
    share_already_granted: "La búsqueda gratuita ya fue reclamada.",
  },
  "zh-CN": {
    share_claim: "领取免费搜索",
    share_claiming: "领取中…",
    share_granted: "已获得免费搜索！余额：{balance} 个代币",
    share_already_granted: "免费搜索已被领取。",
  },
  "zh-TW": {
    share_claim: "領取免費搜尋",
    share_claiming: "領取中…",
    share_granted: "已獲得免費搜尋！餘額：{balance} 個代幣",
    share_already_granted: "免費搜尋已被領取。",
  },
  ja: {
    share_claim: "無料検索を受け取る",
    share_claiming: "受け取り中…",
    share_granted: "無料検索が付与されました！残高：{balance} トークン",
    share_already_granted: "無料検索はすでに受け取り済みです。",
  },
  ko: {
    share_claim: "무료 검색 받기",
    share_claiming: "받는 중…",
    share_granted: "무료 검색이 지급되었습니다! 잔액: {balance} 토큰",
    share_already_granted: "무료 검색을 이미 받았습니다.",
  },
  zh: {
    share_claim: "领取免费搜索",
    share_claiming: "领取中…",
    share_granted: "已获得免费搜索！余额：{balance} 个代币",
    share_already_granted: "免费搜索已被领取。",
  },
};

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
  if (!d.radar) {
    console.error(`FAIL ${loc}: no radar section`);
    failures++;
    continue;
  }
  const texts = TRANSLATIONS[loc] || TRANSLATIONS.en;
  for (const [k, v] of Object.entries(texts)) {
    if (typeof d.radar[k] === "string" && d.radar[k] !== v) {
      console.warn(`note ${loc}.radar.${k} already set (${d.radar[k]}), overwriting`);
    }
    d.radar[k] = v;
  }
  // Strip BOM if present, write JSON.stringify(d, null, 2) + "\n".
  const json = JSON.stringify(d, null, 2) + "\n";
  fs.writeFileSync(file, json.replace(/^\uFEFF/, ""), "utf8");
  console.log(`OK ${loc}.radar keys synced`);
}
console.log(failures === 0 ? "ALL LOCALES OK" : `FAILURES: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
