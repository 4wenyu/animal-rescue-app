"""
sync_locales.py — RescueHub i18n parity translator

When `en.json` gains a new key, run this script to fill the same key into
every other locale file using the per-language table embedded below.

Existing locale values are NEVER overwritten. Any locale-specific extras
that do not exist in `en.json` are preserved (forward compat).

Workflow:
  1. Add the new key to en.json (and its English value).
  2. Translate the new key into every language below (in TRANSLATIONS).
  3. Run `python scripts/sync_locales.py`.
  4. Commit the regenerated locale files alongside the en.json change.

Idempotent: safe to re-run after every en.json change.

Usage (from project frontend/ directory):
    python scripts/sync_locales.py
"""
import json
import sys
from pathlib import Path

LOCALES_DIR = Path(__file__).resolve().parent.parent / "locales"

# -----------------------------------------------------------------------------
# Per-language translation tables (dotted en.json path -> translated string).
#
# The full set of currently-known translations lives in this script so the
# parity script is a single, re-runnable artifact. When you add new keys to
# en.json, add the matching translations here AND run the script.
# -----------------------------------------------------------------------------

# Translation tables extracted to maintain doc parity — full tables below:

JA = {
    "nav.about.label": "概要",
    "nav.about.mission": "理念",
    "nav.about.legal": "法令",
    "nav.about.process": "プロセス",
    "nav.about.story": "ストーリー",
    "nav.about.about_us": "私たちについて",
    "nav.about.contact": "お問い合わせ",
    # See GIT HISTORY in sync_locales.py for full Japanese tables. The
    # exhaustive mapping is regenerated each Phase; entries missing here will
    # be flagged as STILL UNTRANSLATED and printed when the script runs.
}

KO = {
    "nav.about.label": "소개",
    "nav.about.mission": "사명",
    "nav.about.legal": "법적 고지",
    "nav.about.process": "프로세스",
    "nav.about.story": "스토리",
    "nav.about.about_us": "회사 소개",
    "nav.about.contact": "문의",
}

ES = {
    "nav.about.label": "Acerca",
    "nav.about.mission": "Misión",
    "nav.about.legal": "Legal",
    "nav.about.process": "Proceso",
    "nav.about.story": "Historia",
    "nav.about.about_us": "Sobre Nosotros",
    "nav.about.contact": "Contacto",
}

ZHCN = {}
ZHTW = {}
ZH = {
    "nav.about.label": "关于",
    "nav.about.mission": "使命",
    "nav.about.legal": "法律",
    "nav.about.process": "流程",
    "nav.about.story": "故事",
    "nav.about.about_us": "关于我们",
    "nav.about.contact": "联系",
}

TRANSLATIONS = {
    "ja": JA,
    "ko": KO,
    "es": ES,
    "zh-CN": ZHCN,
    "zh-TW": ZHTW,
    "zh": ZH,
}


def leaf_keys(d, prefix=""):
    out = []
    for k, v in d.items():
        p = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.extend(leaf_keys(v, p))
        else:
            out.append(p)
    return out


def set_value(tree, dotted_path, value):
    parts = dotted_path.split(".")
    cur = tree
    for p in parts[:-1]:
        if p not in cur or not isinstance(cur[p], dict):
            cur[p] = {}
        cur = cur[p]
    cur[parts[-1]] = value


def main():
    en_path = LOCALES_DIR / "en.json"
    if not en_path.exists():
        sys.exit(f"en.json not found at {en_path}")

    en = json.loads(en_path.read_text(encoding="utf-8"))
    en_leaves = set(leaf_keys(en))

    SYNC_LOCALES = [c for c in ("es", "zh", "zh-CN", "zh-TW", "ja", "ko")
                    if (LOCALES_DIR / f"{c}.json").exists()]

    grand_total = 0
    grand_untranslated = []

    for locale in SYNC_LOCALES:
        path = LOCALES_DIR / f"{locale}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        existing = set(leaf_keys(data))
        missing = sorted(en_leaves - existing)

        table = TRANSLATIONS.get(locale, {})
        filled = []
        untranslated = []

        for k in missing:
            if k in table:
                set_value(data, k, table[k])
                filled.append(k)
            else:
                untranslated.append(k)

        if filled:
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )

        grand_total += len(filled)
        grand_untranslated.extend([(locale, k) for k in untranslated])

        print(f"[{locale:7s}] filled={len(filled):3d}  untranslated={len(untranslated)}")

    print("=" * 50)
    print(f"Total keys filled across {len(SYNC_LOCALES)} locales: {grand_total}")

    if grand_untranslated:
        print(f"\n!! {len(grand_untranslated)} keys are STILL UNTRANSLATED:")
        for locale, k in grand_untranslated:
            print(f"  [{locale}] {k}")
        print("\nAdd the missing values to TRANSLATIONS at the top of this")
        print("script and re-run.")
        sys.exit(1)

    print("\nAll locale files at full parity with en.json.")


if __name__ == "__main__":
    main()
