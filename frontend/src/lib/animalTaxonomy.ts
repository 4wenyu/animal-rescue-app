/**
 * Animal taxonomy — single source of truth for species + breed dropdowns.
 *
 * Species names are translated into all 7 project locales. Breed names are
 * proper nouns and therefore stay canonical across locales (industry practice:
 * "Golden Retriever", "Maine Coon", "Holland Lop" are not translated), with
 * the descriptive/common types (Mixed Breed, Domestic Shorthair, Tabby,
 * Tuxedo) translated because they are not proper nouns.
 *
 * Consumers pass the active locale from `useI18n()` to `speciesLabel` /
 * `breedLabel`, so dropdown items are always in the user's language.
 */

export type LocaleCode =
  | "en"
  | "es"
  | "zh-CN"
  | "zh-TW"
  | "ja"
  | "ko";

export type SpeciesCode =
  | "dog"
  | "cat"
  | "rabbit"
  | "turtle"
  | "bird"
  | "small_mammal"
  | "reptile"
  | "fish"
  | "other";

/** Canonical species codes — single source of truth for every dropdown/schema. */
export const SPECIES_CODES: SpeciesCode[] = [
  "dog",
  "cat",
  "rabbit",
  "turtle",
  "bird",
  "small_mammal",
  "reptile",
  "fish",
  "other",
];

export interface SpeciesEntry {
  code: SpeciesCode;
  /** lucide icon name is resolved by the consumer, not stored here. */
  label: Record<LocaleCode, string>;
}

export interface BreedEntry {
  code: string;
  /** Canonical English name (used as the JSON key + fallback). */
  en: string;
  /** Translated label overrides per locale; omitted locales fall back to `en`. */
  label: Partial<Record<LocaleCode, string>>;
}

export const SPECIES: SpeciesEntry[] = [
  { code: "dog", label: { en: "Dog", es: "Perro", "zh-CN": "狗", "zh-TW": "狗", ja: "犬", ko: "개" } },
  { code: "cat", label: { en: "Cat", es: "Gato", "zh-CN": "猫", "zh-TW": "貓", ja: "猫", ko: "고양이" } },
  { code: "rabbit", label: { en: "Rabbit", es: "Conejo", "zh-CN": "兔子", "zh-TW": "兔子", ja: "ウサギ", ko: "토끼" } },
  { code: "turtle", label: { en: "Turtle / Tortoise", es: "Tortuga", "zh-CN": "乌龟", "zh-TW": "烏龜", ja: "カメ", ko: "거북이" } },
  { code: "bird", label: { en: "Bird", es: "Pájaro", "zh-CN": "鸟", "zh-TW": "鳥", ja: "鳥", ko: "새" } },
  { code: "small_mammal", label: { en: "Small Mammal", es: "Mamífero pequeño", "zh-CN": "小型哺乳动物", "zh-TW": "小型哺乳動物", ja: "小型哺乳類", ko: "소형 포유류" } },
  { code: "reptile", label: { en: "Reptile", es: "Reptil", "zh-CN": "爬行动物", "zh-TW": "爬行動物", ja: "爬虫類", ko: "파충류" } },
  { code: "fish", label: { en: "Fish", es: "Pez", "zh-CN": "鱼", "zh-TW": "魚", ja: "魚", ko: "물고기" } },
  { code: "other", label: { en: "Other", es: "Otro", "zh-CN": "其他", "zh-TW": "其他", ja: "その他", ko: "기타" } },
];

export const BREEDS_BY_SPECIES: Record<SpeciesCode, BreedEntry[]> = {
  dog: [
    { code: "mixed", en: "Mixed Breed", label: { es: "Raza mixta", "zh-CN": "混血犬", "zh-TW": "混血犬", ja: "ミックス犬", ko: "믹스견" } },
    { code: "golden_retriever", en: "Golden Retriever", label: {} },
    { code: "german_shepherd", en: "German Shepherd", label: { es: "Pastor Alemán", "zh-CN": "德国牧羊犬", "zh-TW": "德國牧羊犬", ja: "ジャーマン・シェパード", ko: "저먼 셰퍼드" } },
    { code: "french_bulldog", en: "French Bulldog", label: { es: "Bulldog Francés", "zh-CN": "法国斗牛犬", "zh-TW": "法國鬥牛犬", ja: "フレンチ・ブルドッグ", ko: "프렌치 불도그" } },
    { code: "siberian_husky", en: "Siberian Husky", label: { "zh-CN": "西伯利亚雪橇犬", "zh-TW": "西伯利亞雪橇犬", ja: "シベリアン・ハスキー", ko: "시베리안 허스키" } },
    { code: "beagle", en: "Beagle", label: { ja: "ビーグル", ko: "비글" } },
    { code: "labrador_retriever", en: "Labrador Retriever", label: { "zh-CN": "拉布拉多寻回犬", "zh-TW": "拉布拉多尋回犬", ja: "ラブラドール・レトリーバー", ko: "래브라도 리트리버" } },
    { code: "boxer", en: "Boxer", label: { ja: "ボクサー", ko: "복서" } },
    { code: "cocker_spaniel", en: "Cocker Spaniel", label: { "zh-CN": "可卡犬", "zh-TW": "可卡犬", ja: "コッカー・スパニエル", ko: "코커 스패니얼" } },
    { code: "poodle", en: "Poodle", label: { "zh-CN": "贵宾犬", "zh-TW": "貴賓犬", ja: "プードル", ko: "푸들" } },
    { code: "dachshund", en: "Dachshund", label: { "zh-CN": "腊肠犬", "zh-TW": "臘腸犬", ja: "ダックスフント", ko: "닥스훈트" } },
    { code: "rottweiler", en: "Rottweiler", label: { ja: "ロットワイラー", ko: "로트와일러" } },
    { code: "shih_tzu", en: "Shih Tzu", label: { "zh-CN": "西施犬", "zh-TW": "西施犬", ja: "シーズー", ko: "시추" } },
    { code: "chihuahua", en: "Chihuahua", label: { "zh-CN": "吉娃娃", "zh-TW": "吉娃娃", ja: "チワワ", ko: "치와와" } },
    { code: "pit_bull", en: "American Pit Bull Terrier", label: { es: "Pit Bull Americano", "zh-CN": "美国比特犬", "zh-TW": "美國比特犬", ja: "アメリカン・ピット・ブル", ko: "아메리칸 핏불 테리어" } },
    { code: "border_collie", en: "Border Collie", label: { "zh-CN": "边境牧羊犬", "zh-TW": "邊境牧羊犬", ja: "ボーダー・コリー", ko: "보더 콜리" } },
  ],
  cat: [
    { code: "domestic_shorthair", en: "Domestic Shorthair", label: { es: "Gato común de pelo corto", "zh-CN": "家养短毛猫", "zh-TW": "家養短毛貓", ja: "雑種短毛", ko: "도메스틱 숏헤어" } },
    { code: "domestic_longhair", en: "Domestic Longhair", label: { es: "Gato común de pelo largo", "zh-CN": "家养长毛猫", "zh-TW": "家養長毛貓", ja: "雑種長毛", ko: "도메스틱 롱헤어" } },
    { code: "tabby", en: "Tabby", label: { es: "Atigrado", "zh-CN": "虎斑猫", "zh-TW": "虎斑貓", ja: "タビー", ko: "태비" } },
    { code: "tuxedo", en: "Tuxedo", label: { es: "Blanquinegro", "zh-CN": "燕尾服猫", "zh-TW": "燕尾服貓", ja: "タキシード", ko: "턱시도" } },
    { code: "siamese", en: "Siamese", label: { "zh-CN": "暹罗猫", "zh-TW": "暹羅貓", ja: "シャム", ko: "샴" } },
    { code: "maine_coon", en: "Maine Coon", label: { "zh-CN": "缅因猫", "zh-TW": "緬因貓", ja: "メインクーン", ko: "메인쿤" } },
    { code: "persian", en: "Persian", label: { "zh-CN": "波斯猫", "zh-TW": "波斯貓", ja: "ペルシャ", ko: "페르시안" } },
    { code: "ragdoll", en: "Ragdoll", label: { "zh-CN": "布偶猫", "zh-TW": "布偶貓", ja: "ラグドール", ko: "래그돌" } },
    { code: "bengal", en: "Bengal", label: { "zh-CN": "孟加拉猫", "zh-TW": "孟加拉貓", ja: "ベンガル", ko: "벵갈" } },
    { code: "british_shorthair", en: "British Shorthair", label: { "zh-CN": "英国短毛猫", "zh-TW": "英國短毛貓", ja: "ブリティッシュショートヘア", ko: "브리티시 숏헤어" } },
  ],
  rabbit: [
    { code: "mixed", en: "Mixed Breed", label: { es: "Raza mixta", "zh-CN": "混血兔", "zh-TW": "混血兔", ja: "ミックス", ko: "믹스" } },
    { code: "holland_lop", en: "Holland Lop", label: { ja: "ホーランドロップ", ko: "홀랜드 롭" } },
    { code: "netherland_dwarf", en: "Netherland Dwarf", label: { "zh-CN": "荷兰侏儒兔", "zh-TW": "荷蘭侏儒兔", ja: "ネザーランドドワーフ", ko: "네덜란드 드워프" } },
    { code: "lionhead", en: "Lionhead", label: { "zh-CN": "狮子兔", "zh-TW": "獅子兔", ja: "ライオンヘッド", ko: "라이온헤드" } },
    { code: "mini_lop", en: "Mini Lop", label: { ja: "ミニロップ", ko: "미니 롭" } },
    { code: "rex", en: "Rex", label: { "zh-CN": "雷克斯兔", "zh-TW": "雷克斯兔", ja: "レッキス", ko: "렉스" } },
    { code: "flemish_giant", en: "Flemish Giant", label: { "zh-CN": "巨型兔", "zh-TW": "巨型兔", ja: "フレミッシュジャイアント", ko: "플레미시 자이언트" } },
  ],
  turtle: [
    { code: "red_eared_slider", en: "Red-Eared Slider", label: { es: "Tortuga de orejas rojas", "zh-CN": "红耳龟", "zh-TW": "紅耳龜", ja: "ミシシッピアカミミガメ", ko: "붉은귀거북" } },
    { code: "box_turtle", en: "Box Turtle", label: { es: "Tortuga de caja", "zh-CN": "箱龟", "zh-TW": "箱龜", ja: "アメリカハコガメ", ko: "상자거북" } },
    { code: "painted_turtle", en: "Painted Turtle", label: { es: "Tortuga pintada", "zh-CN": "锦龟", "zh-TW": "錦龜", ja: "ニシキガメ", ko: "페인티드 거북" } },
    { code: "russian_tortoise", en: "Russian Tortoise", label: { es: "Tortuga rusa", "zh-CN": "俄罗斯陆龟", "zh-TW": "俄羅斯陸龜", ja: "ヨツユビリクガメ", ko: "러시안 육지거북" } },
    { code: "sulcata", en: "Sulcata Tortoise", label: { "zh-CN": "苏卡达陆龟", "zh-TW": "蘇卡達陸龜", ja: "ケヅメリクガメ", ko: "설카타 거북" } },
  ],
  bird: [
    { code: "budgerigar", en: "Budgerigar (Budgie)", label: { es: "Periquito", "zh-CN": "虎皮鹦鹉", "zh-TW": "虎皮鸚鵡", ja: "セキセイインコ", ko: "잉꼬" } },
    { code: "cockatiel", en: "Cockatiel", label: { es: "Cacatúa ninfa", "zh-CN": "鸡尾鹦鹉", "zh-TW": "雞尾鸚鵡", ja: "オカメインコ", ko: "코카티엘" } },
    { code: "lovebird", en: "Lovebird", label: { es: "Agapornis", "zh-CN": "爱情鸟", "zh-TW": "愛情鳥", ja: "コザクラインコ", ko: "러브버드" } },
    { code: "parakeet", en: "Parakeet", label: { es: "Perico", "zh-CN": "长尾鹦鹉", "zh-TW": "長尾鸚鵡", ja: "インコ", ko: "잉꼬" } },
    { code: "african_grey", en: "African Grey Parrot", label: { es: "Loro gris africano", "zh-CN": "非洲灰鹦鹉", "zh-TW": "非洲灰鸚鵡", ja: "ヨウム", ko: "아프리카 회색앵무" } },
    { code: "cockatoo", en: "Cockatoo", label: { es: "Cacatúa", "zh-CN": "凤头鹦鹉", "zh-TW": "鳳頭鸚鵡", ja: "オウム", ko: "카카투" } },
  ],
  small_mammal: [
    { code: "guinea_pig", en: "Guinea Pig", label: { es: "Cobaya", "zh-CN": "豚鼠", "zh-TW": "天竺鼠", ja: "モルモット", ko: "기니피그" } },
    { code: "hamster", en: "Hamster", label: { es: "Hámster", "zh-CN": "仓鼠", "zh-TW": "倉鼠", ja: "ハムスター", ko: "햄스터" } },
    { code: "ferret", en: "Ferret", label: { es: "Hurón", "zh-CN": "雪貂", "zh-TW": "雪貂", ja: "フェレット", ko: "페럿" } },
    { code: "chinchilla", en: "Chinchilla", label: { es: "Chinchilla", "zh-CN": "龙猫", "zh-TW": "龍貓", ja: "チンチラ", ko: "친칠라" } },
    { code: "gerbil", en: "Gerbil", label: { es: "Jerbo", "zh-CN": "沙鼠", "zh-TW": "沙鼠", ja: "スナネズミ", ko: "저빌" } },
    { code: "rat", en: "Rat", label: { es: "Rata", "zh-CN": "大鼠", "zh-TW": "大鼠", ja: "ラット", ko: "랫" } },
  ],
  reptile: [
    { code: "bearded_dragon", en: "Bearded Dragon", label: { es: "Dragón barbudo", "zh-CN": "鬃狮蜥", "zh-TW": "鬃獅蜥", ja: "フトアゴヒゲトカゲ", ko: "비어디드래곤" } },
    { code: "leopard_gecko", en: "Leopard Gecko", label: { es: "Gecko leopardo", "zh-CN": "豹纹守宫", "zh-TW": "豹紋守宮", ja: "ヒョウモントカゲモドキ", ko: "레오파드 게코" } },
    { code: "ball_python", en: "Ball Python", label: { es: "Pitón bola", "zh-CN": "球蟒", "zh-TW": "球蟒", ja: "ボールパイソン", ko: "볼파이톤" } },
    { code: "corn_snake", en: "Corn Snake", label: { es: "Serpiente del maíz", "zh-CN": "玉米蛇", "zh-TW": "玉米蛇", ja: "コーンスネーク", ko: "콘스네이크" } },
    { code: "iguana", en: "Iguana", label: { es: "Iguana", "zh-CN": "鬣蜥", "zh-TW": "鬣蜥", ja: "イグアナ", ko: "이구아나" } },
    { code: "chameleon", en: "Chameleon", label: { es: "Camaleón", "zh-CN": "变色龙", "zh-TW": "變色龍", ja: "カメレオン", ko: "카멜레온" } },
  ],
  fish: [
    { code: "goldfish", en: "Goldfish", label: { es: "Pez dorado", "zh-CN": "金鱼", "zh-TW": "金魚", ja: "金魚", ko: "금붕어" } },
    { code: "betta", en: "Betta (Siamese Fighting Fish)", label: { es: "Pez betta", "zh-CN": "斗鱼", "zh-TW": "鬥魚", ja: "ベタ", ko: "베타" } },
    { code: "koi", en: "Koi", label: { es: "Carpa koi", "zh-CN": "锦鲤", "zh-TW": "錦鯉", ja: "鯉", ko: "잉어" } },
    { code: "guppy", en: "Guppy", label: { es: "Guppy", "zh-CN": "孔雀鱼", "zh-TW": "孔雀魚", ja: "グッピー", ko: "구피" } },
    { code: "tetra", en: "Tetra", label: { es: "Tetra", "zh-CN": "灯鱼", "zh-TW": "燈魚", ja: "テトラ", ko: "테트라" } },
    { code: "cichlid", en: "Cichlid", label: { es: "Cíclido", "zh-CN": "慈鲷", "zh-TW": "慈鯛", ja: "シクリッド", ko: "시클리드" } },
  ],
  other: [],
};

/** Resolve a species label for the given locale (with graceful fallback). */
export function speciesLabel(code: SpeciesCode, locale: string): string {
  const entry = SPECIES.find((s) => s.code === code);
  if (!entry) return code;
  return entry.label[locale as LocaleCode] ?? entry.label.en;
}

/** Resolve a breed label for the given locale (falling back to canonical EN). */
export function breedLabel(code: string, locale: string): string {
  for (const list of Object.values(BREEDS_BY_SPECIES)) {
    const entry = list.find((b) => b.code === code);
    if (entry) return entry.label[locale as LocaleCode] ?? entry.en;
  }
  return code;
}

/** Breed list for a species, pre-labeled for the given locale. */
export function breedsForSpecies(
  species: SpeciesCode,
  locale: string,
): { code: string; label: string }[] {
  const list = BREEDS_BY_SPECIES[species] ?? [];
  return list.map((b) => ({ code: b.code, label: breedLabel(b.code, locale) }));
}

/** Species list pre-labeled for the given locale. */
export function speciesForLocale(locale: string): { code: SpeciesCode; label: string }[] {
  return SPECIES.map((s) => ({ code: s.code, label: speciesLabel(s.code, locale) }));
}
