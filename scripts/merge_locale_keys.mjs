import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve("frontend/locales");
const files = ["en.json", "es.json", "zh-CN.json", "zh-TW.json", "ja.json", "ko.json", "zh.json"];

function setPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== "object" || cur[parts[i]] === null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  if (cur[parts[parts.length - 1]] === undefined) cur[parts[parts.length - 1]] = value;
}

const personalities = {
  Buddy: "A gentle, people-loving companion who brightens every room.",
  Max: "Loyal and attentive — bonds deeply once he knows he can trust you.",
  Bella: "A social butterfly who adores playtime and cuddles in equal measure.",
  Luna: "Curious and lively, always ready for the next walk together.",
  Charlie: "Easygoing and food-motivated — a cheerful sidekick for any home.",
  Daisy: "Friendly and eager to make you proud on every outing.",
  Rocky: "A calm, affectionate pal who thrives with a patient family.",
  Molly: "Sociable and sweet, happiest when she's close to her people.",
  Duke: "Steady and loyal, looking for an experienced, loving home.",
  Sadie: "A warm-hearted girl who loves slow mornings and kind voices.",
  Oscar: "A curious little explorer with a playful, fearless streak.",
  Lola: "A calm senior lady who loves slow walks and warm laps.",
};

const translations = {
  en: {
    "hero.cta_help": "I want to help",
    "hero.two_doors": "Lost a pet? Start a search. Want to help? Meet who needs a home.",
    "nav.share_review": "Share review",
    "stay.streak": "You've checked in {days} days. {name} is still here.",
    "stay.streak_start": "Come back tomorrow — {name} is still waiting.",
    "ambient.on": "Calm sound on",
    "ambient.off": "Calm sound off",
    "adopt.next_steps": "What happens next",
    "adopt.next_steps_body": "We reply within 24 hours with hours, next steps, and how to meet {name}.",
    "adopt.share": "Share",
    "adopt.poster": "Download a share image",
    "adopt.sticky_adopt": "Adopt {name}",
    "shares.review_empty": "No pending shares. The 10-share free search unlocks when staff verify real posts.",
    "shares.review_verify": "Verify",
    "shares.review_reject": "Reject",
    "shares.review_error": "Could not update that share.",
    "fundraising.wallet.preview_note": "Preview pledges are recorded on the demo ledger and do not charge a card. Live card checkout requires Stripe.",
    "site.description": "Find a missing pet in the first hour, or meet an animal who needs a home tonight.",
  },
  es: {
    "hero.cta_help": "Quiero ayudar",
    "hero.two_doors": "¿Perdiste una mascota? Empieza una búsqueda. ¿Quieres ayudar? Conoce a quien necesita hogar.",
    "nav.share_review": "Revisar compartidos",
    "stay.streak": "Has vuelto {days} días. {name} sigue aquí.",
    "stay.streak_start": "Vuelve mañana — {name} sigue esperando.",
    "ambient.on": "Sonido suave activado",
    "ambient.off": "Sonido suave desactivado",
    "adopt.next_steps": "Qué sigue",
    "adopt.next_steps_body": "Respondemos en 24 horas con horarios, pasos y cómo conocer a {name}.",
    "adopt.share": "Compartir",
    "adopt.poster": "Descargar imagen para compartir",
    "adopt.sticky_adopt": "Adoptar a {name}",
    "shares.review_empty": "No hay compartidos pendientes. Diez verificados desbloquean una búsqueda gratis.",
    "shares.review_verify": "Verificar",
    "shares.review_reject": "Rechazar",
    "shares.review_error": "No se pudo actualizar.",
    "fundraising.wallet.preview_note": "Las promesas de vista previa no cobran tarjeta. El cobro real requiere Stripe.",
    "site.description": "Encuentra una mascota perdida a tiempo, o conoce a un animal que necesita hogar.",
  },
  "zh-CN": {
    "hero.cta_help": "我想帮忙",
    "hero.two_doors": "丢了宠物？开始搜寻。想帮忙？来认识需要家的动物。",
    "nav.share_review": "分享审核",
    "stay.streak": "你已连续来访 {days} 天。{name} 还在这里。",
    "stay.streak_start": "明天再来——{name} 还在等你。",
    "ambient.on": "已开启轻柔背景音",
    "ambient.off": "背景音关闭",
    "adopt.next_steps": "接下来会发生什么",
    "adopt.next_steps_body": "我们会在 24 小时内回复开放时间、后续步骤，以及如何见到 {name}。",
    "adopt.share": "分享",
    "adopt.poster": "下载分享图",
    "adopt.sticky_adopt": "领养 {name}",
    "shares.review_empty": "暂无待审核分享。员工核实 10 次真实分享后可解锁免费搜寻。",
    "shares.review_verify": "核实",
    "shares.review_reject": "拒绝",
    "shares.review_error": "无法更新该分享。",
    "fundraising.wallet.preview_note": "预览承诺只记入演示账本，不会扣款。正式收款需要 Stripe。",
    "site.description": "在第一时间寻找走失宠物，或认识今晚需要家的动物。",
    "personalities.Oscar": "好奇心强的小小探险家，带着玩心和勇敢。",
    "personalities.Buddy": "温柔亲人，总能把房间变得明亮。",
    "personalities.Max": "忠诚专注，一旦信任你就会紧紧相依。",
    "personalities.Bella": "爱玩也爱抱抱的社交小能手。",
    "personalities.Luna": "好奇又活泼，随时准备一起去散步。",
    "personalities.Charlie": "随和、爱吃，是家里的开心搭档。",
    "personalities.Daisy": "友善热心，每次出门都想让你骄傲。",
    "personalities.Rocky": "沉稳亲人，适合有耐心的家庭。",
    "personalities.Molly": "爱社交，最喜欢依偎在人身边。",
    "personalities.Duke": "踏实忠诚，需要有经验、有爱的家。",
    "personalities.Sadie": "心地温暖，喜欢慢慢的早晨和温柔的声音。",
    "personalities.Lola": "沉稳的年长女孩，爱慢走和暖暖的膝上。",
  },
  "zh-TW": {
    "hero.cta_help": "我想幫忙",
    "hero.two_doors": "丟了寵物？開始搜尋。想幫忙？來認識需要家的動物。",
    "nav.share_review": "分享審核",
    "stay.streak": "你已連續來訪 {days} 天。{name} 還在這裡。",
    "stay.streak_start": "明天再來——{name} 還在等你。",
    "ambient.on": "已開啟輕柔背景音",
    "ambient.off": "背景音關閉",
    "adopt.next_steps": "接下來會發生什麼",
    "adopt.next_steps_body": "我們會在 24 小時內回覆開放時間、後續步驟，以及如何見到 {name}。",
    "adopt.share": "分享",
    "adopt.poster": "下載分享圖",
    "adopt.sticky_adopt": "領養 {name}",
    "shares.review_empty": "暫無待審核分享。員工核實 10 次真實分享後可解鎖免費搜尋。",
    "shares.review_verify": "核實",
    "shares.review_reject": "拒絕",
    "shares.review_error": "無法更新該分享。",
    "fundraising.wallet.preview_note": "預覽承諾只記入示範帳本，不會扣款。正式收款需要 Stripe。",
    "site.description": "在第一時間尋找走失寵物，或認識今晚需要家的動物。",
    "personalities.Oscar": "好奇心強的小小探險家，帶著玩心和勇敢。",
  },
  ja: {
    "hero.cta_help": "助けたい",
    "hero.two_doors": "ペットがいなくなった？検索を始める。助けたい？家を待つ子に会う。",
    "nav.share_review": "シェア審査",
    "stay.streak": "{days}日連続で来ています。{name}はまだここにいます。",
    "stay.streak_start": "また明日来てください。{name}は待っています。",
    "ambient.on": "やさしい音オン",
    "ambient.off": "やさしい音オフ",
    "adopt.next_steps": "このあと",
    "adopt.next_steps_body": "24時間以内に、開館時間・次の手順・{name}との会い方をお返事します。",
    "adopt.share": "シェア",
    "adopt.poster": "シェア画像を保存",
    "adopt.sticky_adopt": "{name}を引き取る",
    "shares.review_empty": "未審査のシェアはありません。10件の確認で無料検索が開きます。",
    "shares.review_verify": "確認",
    "shares.review_reject": "却下",
    "shares.review_error": "更新できませんでした。",
    "fundraising.wallet.preview_note": "プレビューの寄付はカード決済しません。本番は Stripe が必要です。",
    "site.description": "失踪したペットをすぐに探し、今夜家が必要な子に会う。",
  },
  ko: {
    "hero.cta_help": "돕고 싶어요",
    "hero.two_doors": "반려동물을 잃었나요? 검색을 시작하세요. 돕고 싶나요? 가족이 필요한 아이를 만나세요.",
    "nav.share_review": "공유 검토",
    "stay.streak": "{days}일 연속 방문했습니다. {name}는 아직 여기 있어요.",
    "stay.streak_start": "내일 다시 와 주세요. {name}가 기다리고 있어요.",
    "ambient.on": "잔잔한 소리 켜짐",
    "ambient.off": "잔잔한 소리 꺼짐",
    "adopt.next_steps": "다음 단계",
    "adopt.next_steps_body": "24시간 안에 운영 시간, 다음 절차, {name}를 만나는 방법을 회신합니다.",
    "adopt.share": "공유",
    "adopt.poster": "공유 이미지 저장",
    "adopt.sticky_adopt": "{name} 입양하기",
    "shares.review_empty": "대기 중인 공유가 없습니다. 직원 확인 10회면 무료 검색이 열립니다.",
    "shares.review_verify": "확인",
    "shares.review_reject": "거절",
    "shares.review_error": "업데이트하지 못했습니다.",
    "fundraising.wallet.preview_note": "미리보기 서약은 카드 결제가 아닙니다. 실제 결제는 Stripe가 필요합니다.",
    "site.description": "잃어버린 반려동물을 바로 찾고, 오늘 집이 필요한 아이를 만나세요.",
  },
};

translations.zh = translations["zh-CN"];

for (const file of files) {
  const locale = file.replace(".json", "");
  const path = resolve(dir, file);
  const json = JSON.parse(readFileSync(path, "utf8"));
  const pack = { ...translations.en, ...(translations[locale] ?? {}) };
  for (const [key, value] of Object.entries(pack)) setPath(json, key, value);
  if (!json.personalities) json.personalities = {};
  for (const [name, text] of Object.entries(personalities)) {
    if (!json.personalities[name]) json.personalities[name] = translations[locale]?.[`personalities.${name}`] ?? text;
  }
  if (!json.shares) json.shares = {};
  if (!json.stay) json.stay = {};
  if (!json.ambient) json.ambient = {};
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
}

const dogsPath = resolve("frontend/data/dogs.json");
const dogs = JSON.parse(readFileSync(dogsPath, "utf8"));
for (const dog of dogs) {
  dog.city = dog.city ?? "Harborview";
  if (dog.name === "Luna") {
    dog.personality = "Curious and lively, always ready for the next walk together.";
  }
}
writeFileSync(dogsPath, JSON.stringify(dogs, null, 2) + "\n");
console.log("locales + dogs.json patched");
