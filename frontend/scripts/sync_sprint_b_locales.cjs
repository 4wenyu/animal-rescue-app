// Sprint B — i18n key sync for non-English locales.
// Merges new nav/hero/adoption_feed/chatIntake keys + corrected sponsorModal
// copy (100-token sponsor grant, honest) into each locale JSON, preserving
// all existing keys and formatting (2-space indent, trailing newline).
const fs = require("fs");
const path = require("path");

const LOCALES = ["es", "zh", "zh-CN", "zh-TW", "ja", "ko"];

// Canonical English sponsor body is identical across locales (proper noun +
// factual claim, IRC §513(i) neutral). Only body_translated / disclaimer /
// success / insufficient get translated per locale.
const SPONSOR_BODY_EN =
  "Chewy is acknowledged as a proud sponsor of the Lost Pet Search program. View their sponsor message to receive a 100-token search grant that fully covers the search fee.";

const TRANS = {
  es: {
    nav_find_my_pet: "Buscar mi mascota",
    hero_cta_lost_pet: "Perdí una mascota",
    meet_name: "Conoce a {name}",
    still_available: "Sigue disponible",
    on_hold: "En espera",
    needs_home_by: "Necesita un hogar antes del {date}",
    adopt: "Adoptar",
    foster: "Acoger",
    donate: "Donar",
    contact_shelter: "Contactar refugio",
    optional_badge: "opcional",
    mobile_progress: "Iniciar: {count}/2",
    not_sure_note:
      "¿No estás seguro de algún detalle? No pasa nada: puedes iniciar la búsqueda con lo esencial y responder «no estoy seguro» cuando lo necesites.",
    signin_title: "Crea una cuenta gratuita para activar",
    signin_body:
      "Los datos de tu búsqueda están listos. Una cuenta gratuita te permite guardar, compartir y seguir tu búsqueda de mascota perdida.",
    signin_create: "Crear cuenta",
    signin_login: "Ya tengo una cuenta",
    adopt: {
      story:
        "{name} está buscando un hogar definitivo lleno de cariño. Nuestro equipo ha ido conociendo a {name} mientras espera: pregúntanos cualquier cosa sobre su personalidad, sus hábitos y sus cosas favoritas.",
      hold_note:
        "{name} se encuentra actualmente en una breve retención por extravío. Estará listo para ir a casa el {date}.",
      apply_to_adopt: "Solicita adoptar a {name}",
      apply_to_foster: "Solicita acoger a {name}",
      apply_note:
        "Esto llega directamente a nuestro coordinador de adopción; no se necesita cuenta. Normalmente respondemos en 24 horas.",
      form_name: "Nombre completo",
      form_name_ph: "Juan Pérez",
      form_email: "Correo electrónico",
      form_phone: "Teléfono (opcional)",
      form_phone_ph: "(555) 555-0100",
      form_message: "Cuéntanos sobre tu hogar (opcional)",
      form_message_ph:
        "¿Casa o apartamento? ¿Otras mascotas? ¿Niños? ¿Algo más que debamos saber…?",
      form_submit: "Enviar solicitud",
      form_submitting: "Enviando…",
      form_success:
        "Solicitud recibida: nuestro coordinador de adopción se pondrá en contacto pronto.",
      form_error: "Algo salió mal. Por favor, inténtalo de nuevo en un momento.",
    },
    body_translated:
      "Chewy es reconocido como un orgulloso patrocinador del programa Lost Pet Search. Vea su mensaje para recibir una subvención de 100 tokens que cubre por completo la tarifa de búsqueda.",
    ack_disclaimer:
      "Al continuar, reconoce el mensaje del patrocinador anterior. Recibirá una subvención de 100 tokens que cubre por completo la tarifa de 100 tokens del servicio Lost Pet Search.",
    success_body:
      "Subvención de 100 tokens aplicada, que cubre por completo el servicio Lost Pet Search. Iniciando la búsqueda ahora…",
    insufficient_body:
      "Su búsqueda Lost Pet Search normalmente está financiada por la subvención del patrocinador. No se pudo completar esta vez. Gane más tokens y vuelva, o cierre este diálogo para abandonar la solicitud.",
    insufficient_footnote:
      "El mensaje del patrocinador no se acreditó porque la vía de gasto no pudo completarse.",
    earn_path_cta: "Ir al panel para ganar tokens",
  },
  "zh-CN": {
    nav_find_my_pet: "寻找我的宠物",
    hero_cta_lost_pet: "我丢失了宠物",
    meet_name: "认识{name}",
    still_available: "仍可领养",
    on_hold: "等待中",
    needs_home_by: "需在{date}前找到家",
    adopt: "领养",
    foster: "寄养",
    donate: "捐助",
    contact_shelter: "联系收容所",
    optional_badge: "可选",
    mobile_progress: "开始：{count}/2",
    not_sure_note:
      "某个细节不确定？没关系——只需基本信息即可开始搜索，需要时可说“不确定”。",
    signin_title: "创建免费账户以启用搜索",
    signin_body: "您的搜索信息已就绪。免费账户可让您保存、分享并追踪走失宠物搜索。",
    signin_create: "创建账户",
    signin_login: "我已有账户",
    adopt: {
      story:
        "{name} 正在寻找一个充满爱意的永久之家。在我们等待期间，我们的团队一直在了解 {name}——关于他们的性格、习惯和最爱的事物，您可以随时提问。",
      hold_note:
        "{name} 目前处于短暂的流浪收容期。他们将于 {date} 准备好回家。",
      apply_to_adopt: "申请领养 {name}",
      apply_to_foster: "申请寄养 {name}",
      apply_note: "此申请将直接发送给我们的领养协调员，无需账户。我们通常会在 24 小时内回复。",
      form_name: "全名",
      form_name_ph: "张三",
      form_email: "电子邮件",
      form_phone: "电话（可选）",
      form_phone_ph: "(555) 555-0100",
      form_message: "告诉我们您的家庭情况（可选）",
      form_message_ph: "房子还是公寓？其他宠物？孩子？还有其他我们应该知道的吗……",
      form_submit: "提交申请",
      form_submitting: "提交中……",
      form_success: "已收到申请——我们的领养协调员将很快与您联系。",
      form_error: "出了点问题。请稍后再试。",
    },
    body_translated:
      "Chewy 作为「走失宠物搜寻」项目的自豪赞助商在此致谢。查看其赞助信息即可获得可全额覆盖搜索费用的 100 代币搜索补助。",
    ack_disclaimer:
      "继续操作即表示您确认已查看上述赞助信息。您将获得 100 代币补助，可全额覆盖 100 代币的「走失宠物搜寻」服务费用。",
    success_body:
      "已应用 100 代币补助，全额覆盖「走失宠物搜寻」服务。正在启动搜索…",
    insufficient_body:
      "您的走失宠物搜索通常由赞助商补助资助。此次未能完成。请赚取更多代币后返回，或关闭此对话框以放弃请求。",
    insufficient_footnote: "由于支出通道无法完成，赞助信息未被计入。",
    earn_path_cta: "前往控制面板赚取代币",
  },
  zh: {
    nav_find_my_pet: "寻找我的宠物",
    hero_cta_lost_pet: "我丢失了宠物",
    meet_name: "认识{name}",
    still_available: "仍可领养",
    on_hold: "等待中",
    needs_home_by: "需在{date}前找到家",
    adopt: "领养",
    foster: "寄养",
    donate: "捐助",
    contact_shelter: "联系收容所",
    optional_badge: "可选",
    mobile_progress: "开始：{count}/2",
    not_sure_note:
      "某个细节不确定？没关系——只需基本信息即可开始搜索，需要时可说“不确定”。",
    signin_title: "创建免费账户以启用搜索",
    signin_body: "您的搜索信息已就绪。免费账户可让您保存、分享并追踪走失宠物搜索。",
    signin_create: "创建账户",
    signin_login: "我已有账户",
    adopt: {
      story:
        "{name} 正在寻找一个充满爱意的永久之家。在我们等待期间，我们的团队一直在了解 {name}——关于他们的性格、习惯和最爱的事物，您可以随时提问。",
      hold_note:
        "{name} 目前处于短暂的流浪收容期。他们将于 {date} 准备好回家。",
      apply_to_adopt: "申请领养 {name}",
      apply_to_foster: "申请寄养 {name}",
      apply_note: "此申请将直接发送给我们的领养协调员，无需账户。我们通常会在 24 小时内回复。",
      form_name: "全名",
      form_name_ph: "张三",
      form_email: "电子邮件",
      form_phone: "电话（可选）",
      form_phone_ph: "(555) 555-0100",
      form_message: "告诉我们您的家庭情况（可选）",
      form_message_ph: "房子还是公寓？其他宠物？孩子？还有其他我们应该知道的吗……",
      form_submit: "提交申请",
      form_submitting: "提交中……",
      form_success: "已收到申请——我们的领养协调员将很快与您联系。",
      form_error: "出了点问题。请稍后再试。",
    },
    body_translated:
      "Chewy 作为「走失宠物搜寻」项目的自豪赞助商在此致谢。查看其赞助信息即可获得可全额覆盖搜索费用的 100 代币搜索补助。",
    ack_disclaimer:
      "继续操作即表示您确认已查看上述赞助信息。您将获得 100 代币补助，可全额覆盖 100 代币的「走失宠物搜寻」服务费用。",
    success_body:
      "已应用 100 代币补助，全额覆盖「走失宠物搜寻」服务。正在启动搜索…",
    insufficient_body:
      "您的走失宠物搜索通常由赞助商补助资助。此次未能完成。请赚取更多代币后返回，或关闭此对话框以放弃请求。",
    insufficient_footnote: "由于支出通道无法完成，赞助信息未被计入。",
    earn_path_cta: "前往控制面板赚取代币",
  },
  "zh-TW": {
    nav_find_my_pet: "尋找我的寵物",
    hero_cta_lost_pet: "我遺失了寵物",
    meet_name: "認識{name}",
    still_available: "仍可領養",
    on_hold: "等待中",
    needs_home_by: "需在{date}前找到家",
    adopt: "領養",
    foster: "寄養",
    donate: "捐助",
    contact_shelter: "聯繫收容所",
    optional_badge: "選填",
    mobile_progress: "開始：{count}/2",
    not_sure_note:
      "某個細節不確定？沒關係——只需基本資訊即可開始搜尋，需要時可說「不確定」。",
    signin_title: "建立免費帳戶以啟用搜尋",
    signin_body: "您的搜尋資訊已就緒。免費帳戶可讓您儲存、分享並追蹤走失寵物搜尋。",
    signin_create: "建立帳戶",
    signin_login: "我已有帳戶",
    adopt: {
      story:
        "{name} 正在尋找一個充滿愛意的永久之家。在我們等待期間，我們的團隊一直在了解 {name}——關於他們的性格、習慣和最愛的事物，您可以隨時提問。",
      hold_note:
        "{name} 目前處於短暫的流浪收容期。他們將於 {date} 準備好回家。",
      apply_to_adopt: "申請領養 {name}",
      apply_to_foster: "申請寄養 {name}",
      apply_note: "此申請將直接發送給我們的領養協調員，無需帳戶。我們通常會在 24 小時內回覆。",
      form_name: "全名",
      form_name_ph: "王小明",
      form_email: "電子郵件",
      form_phone: "電話（選填）",
      form_phone_ph: "(555) 555-0100",
      form_message: "告訴我們您的家庭情況（選填）",
      form_message_ph: "房子還是公寓？其他寵物？孩子？還有其他我們應該知道的嗎……",
      form_submit: "提交申請",
      form_submitting: "提交中……",
      form_success: "已收到申請——我們的領養協調員將很快與您聯繫。",
      form_error: "出了點問題。請稍後再試。",
    },
    body_translated:
      "Chewy 作為「走失寵物搜尋」計畫的自豪贊助商在此致謝。查看其贊助訊息即可獲得可全額覆蓋搜尋費用的 100 代幣搜尋補助。",
    ack_disclaimer:
      "繼續操作即表示您確認已查看上述贊助訊息。您將獲得 100 代幣補助，可全額覆蓋 100 代幣的「走失寵物搜尋」服務費用。",
    success_body:
      "已套用 100 代幣補助，全額覆蓋「走失寵物搜尋」服務。正在啟動搜尋…",
    insufficient_body:
      "您的走失寵物搜尋通常由贊助商補助資助。此次未能完成。請賺取更多代幣後返回，或關閉此對話框以放棄請求。",
    insufficient_footnote: "由於支出通道無法完成，贊助訊息未被計入。",
    earn_path_cta: "前往控制面板賺取代幣",
  },
  ja: {
    nav_find_my_pet: "ペットを探す",
    hero_cta_lost_pet: "ペットを失くしました",
    meet_name: "{name}に会う",
    still_available: "引き続き募集中",
    on_hold: "保留中",
    needs_home_by: "{date}までに新しいお家が必要",
    adopt: "里親になる",
    foster: "預かりボランティア",
    donate: "寄付",
    contact_shelter: "シェルターに連絡",
    optional_badge: "任意",
    mobile_progress: "開始：{count}/2",
    not_sure_note:
      "細かい点がわからなくても大丈夫です。必要な情報だけで検索を始められます。必要なら「不明」とお答えください。",
    signin_title: "無料アカウントを作成して検索を開始",
    signin_body:
      "検索情報は準備完了です。無料アカウントで、迷子ペット検索を保存・共有・追跡できます。",
    signin_create: "アカウントを作成",
    signin_login: "すでにアカウントをお持ちです",
    adopt: {
      story:
        "{name} は愛情あふれる、ずっと一緒に過ごせるお家を探しています。スタッフは {name} が待っている間、性格や習慣、好きなことを知っています。気になることは何でもお聞きください。",
      hold_note:
        "{name} は現在、短期の迷子保護期間中です。{date} にはお家に迎えられる準備が整う予定です。",
      apply_to_adopt: "{name} の里親申請",
      apply_to_foster: "{name} の預かり申請",
      apply_note:
        "この申請は直接、里親コーディネーターに届きます。アカウントは不要です。通常24時間以内にご返信します。",
      form_name: "氏名",
      form_name_ph: "山田 花子",
      form_email: "メールアドレス",
      form_phone: "電話番号（任意）",
      form_phone_ph: "(555) 555-0100",
      form_message: "お住まいについて（任意）",
      form_message_ph: "戸建て・マンション？ 他のペットは？ お子様は？ その他お伝えしたいこと…",
      form_submit: "申請を送信",
      form_submitting: "送信中…",
      form_success:
        "申請を受け付けました。里親コーディネーターからまもなくご連絡いたします。",
      form_error: "問題が発生しました。しばらくしてからもう一度お試しください。",
    },
    body_translated:
      "Chewy は「Lost Pet Search（迷子ペット捜索）」プログラムの誇りあるスポンサーとして、ここに謝意を表します。スポンサー情報をご覧になると、検索費用を全額カバーする100トークンの検索補助を受け取ることができます。",
    ack_disclaimer:
      "続行することで、上記のスポンサー情報をご覧になったことを確認したものとみなします。100トークンの補助を受け取り、Lost Pet Search サービスの100トークン費用を全額カバーします。",
    success_body:
      "100トークンの補助が適用され、Lost Pet Search サービスを全額カバーしました。検索を開始しています…",
    insufficient_body:
      "Lost Pet Search は通常、スポンサー補助で賄われます。今回は完了できませんでした。トークンを獲得して戻るか、このダイアログを閉じてリクエストを中止してください。",
    insufficient_footnote:
      "支出経路を完了できなかったため、スポンサー情報は付与されませんでした。",
    earn_path_cta: "ダッシュボードでトークンを獲得",
  },
  ko: {
    nav_find_my_pet: "반려동물 찾기",
    hero_cta_lost_pet: "반려동물을 잃었어요",
    meet_name: "{name} 만나기",
    still_available: "아직 입양 가능",
    on_hold: "보류 중",
    needs_home_by: "{date}까지 새 보금자리 필요",
    adopt: "입양하기",
    foster: "임시 보호",
    donate: "기부",
    contact_shelter: "보호소에 문의",
    optional_badge: "선택",
    mobile_progress: "시작: {count}/2",
    not_sure_note:
      "세부 정보를 모르셔도 괜찮습니다. 필수 정보만으로 검색을 시작할 수 있으며, 필요하면 \"잘 모름\"이라고 답하세요.",
    signin_title: "무료 계정을 만들어 검색 활성화",
    signin_body:
      "검색 정보가 준비되었습니다. 무료 계정으로 실종 반려동물 검색을 저장·공유·추적할 수 있습니다.",
    signin_create: "계정 만들기",
    signin_login: "이미 계정이 있습니다",
    adopt: {
      story:
        "{name}은(는) 사랑 가득한 평생의 보금자리를 찾고 있습니다. 직원들은 {name}이(가) 기다리는 동안 성격, 습관, 좋아하는 것을 알아가고 있습니다. 궁금한 점은 무엇이든 물어봐 주세요.",
      hold_note:
        "{name}은(는) 현재 짧은 유실 보호 기간에 있습니다. {date}에 새로운 집에 갈 준비가 완료됩니다.",
      apply_to_adopt: "{name} 입양 신청",
      apply_to_foster: "{name} 임시 보호 신청",
      apply_note:
        "이 신청서는 입양 코디네이터에게 직접 전달되며 계정이 필요 없습니다. 보통 24시간 이내에 답변드립니다.",
      form_name: "성명",
      form_name_ph: "홍길동",
      form_email: "이메일",
      form_phone: "전화번호(선택)",
      form_phone_ph: "(555) 555-0100",
      form_message: "가정 환경을 알려주세요(선택)",
      form_message_ph: "주택 또는 아파트? 다른 반려동물? 아이들? 그 외 알려주실 것…",
      form_submit: "신청서 보내기",
      form_submitting: "보내는 중…",
      form_success: "신청서를 접수했습니다. 입양 코디네이터가 곧 연락드리겠습니다.",
      form_error: "문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    },
    body_translated:
      "Chewy 는 Lost Pet Search(실종 반려동물 수색) 프로그램의 자랑스러운 스폰서로서 감사를 표합니다. 스폰서 메시지를 확인하시면 검색 비용을 전액 충당하는 100 토큰 수색 보조금을 받으실 수 있습니다.",
    ack_disclaimer:
      "계속 진행하시면 위의 스폰서 메시지를 확인하신 것으로 간주됩니다. 100 토큰 보조금을 받으시며, Lost Pet Search 서비스의 100 토큰 비용을 전액 충당합니다.",
    success_body:
      "100 토큰 보조금이 적용되어 Lost Pet Search 서비스를 전액 충당했습니다. 수색을 시작합니다…",
    insufficient_body:
      "Lost Pet Search는 일반적으로 스폰서 보조금으로 지원됩니다. 이번에는 완료하지 못했습니다. 토큰을 더 모은 후 돌아오시거나, 이 대화 상자를 닫아 요청을 중단하세요.",
    insufficient_footnote:
      "지출 경로를 완료하지 못해 스폰서 메시지가 적립되지 않았습니다.",
    earn_path_cta: "대시보드에서 토큰 적립",
  },
};

const dir = path.join(__dirname, "..", "locales");

for (const loc of LOCALES) {
  const file = path.join(dir, `${loc}.json`);
  const dict = JSON.parse(fs.readFileSync(file, "utf8"));
  const tr = TRANS[loc];

  // nav.find_my_pet
  dict.nav = dict.nav || {};
  dict.nav.find_my_pet = tr.nav_find_my_pet;
  // hero.cta_lost_pet
  dict.hero = dict.hero || {};
  dict.hero.cta_lost_pet = tr.hero_cta_lost_pet;
  // adoption_feed additions
  dict.adoption_feed = dict.adoption_feed || {};
  dict.adoption_feed.meet_name = tr.meet_name;
  dict.adoption_feed.still_available = tr.still_available;
  dict.adoption_feed.on_hold = tr.on_hold;
  dict.adoption_feed.needs_home_by = tr.needs_home_by;
  dict.adoption_feed.adopt = tr.adopt;
  dict.adoption_feed.foster = tr.foster;
  dict.adoption_feed.donate = tr.donate;
  dict.adoption_feed.contact_shelter = tr.contact_shelter;
  // chatIntake additions
  dict.chatIntake = dict.chatIntake || {};
  dict.chatIntake.optional_badge = tr.optional_badge;
  dict.chatIntake.mobile_progress = tr.mobile_progress;
  dict.chatIntake.not_sure_note = tr.not_sure_note;
  dict.chatIntake.signin_title = tr.signin_title;
  dict.chatIntake.signin_body = tr.signin_body;
  dict.chatIntake.signin_create = tr.signin_create;
  dict.chatIntake.signin_login = tr.signin_login;
  // adopt profile section (Sprint B #2)
  dict.adopt = tr.adopt;
  // sponsorModal — canonical English body + localized wrapper strings
  dict.sponsorModal = dict.sponsorModal || {};
  dict.sponsorModal.body = SPONSOR_BODY_EN;
  dict.sponsorModal.body_translated = tr.body_translated;
  dict.sponsorModal.ack_disclaimer = tr.ack_disclaimer;
  dict.sponsorModal.success_body = tr.success_body;
  dict.sponsorModal.insufficient_body = tr.insufficient_body;
  dict.sponsorModal.insufficient_footnote = tr.insufficient_footnote;
  dict.sponsorModal.earn_path_cta = tr.earn_path_cta;

  fs.writeFileSync(file, JSON.stringify(dict, null, 2) + "\n", "utf8");
  console.log(`updated ${loc}.json`);
}

// Validate all files still parse + key counts are consistent.
const counts = {};
for (const loc of [...LOCALES, "en"]) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, `${loc}.json`), "utf8"));
  counts[loc] = Object.keys(d).length;
}
console.log("top-level keys:", counts);
