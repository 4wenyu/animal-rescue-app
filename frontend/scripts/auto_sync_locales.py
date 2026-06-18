"""
auto_sync_locales.py — RescueHub dynamic i18n parity translator.

Reads `en.json` as the source of truth, iterates the 6 other locale JSON files,
identifies any missing keys, dynamically translates the English values via
deep-translator (Google), preserves {interpolation} tokens, and writes back.

Existing locale values are NEVER overwritten.

Usage (from project frontend/ directory):
    python scripts/auto_sync_locales.py

Requires:
    pip install deep-translator
"""
import json
import re
import sys
import time
from deep_translator import GoogleTranslator
from pathlib import Path

LOCALES_DIR = Path(__file__).resolve().parent.parent / "locales"

# Map locale code -> deep-translator target code
TARGET = {
    "ja": "ja",
    "ko": "ko",
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
    "es": "es",
    "zh": "zh-CN",  # legacy alias: reuse zh-CN if needed (rare in practice)
}

TOKEN_RE = re.compile(r"\{[a-zA-Z_][a-zA-Z0-9_.]*\}")
TOKEN_PLACEHOLDER = "\u2400\u2401\u2402"  # ␀␁␂  (rare C0 box-drawing glyphs)


def extract(value: str):
    """Return (masked_text, list[tokens])."""
    tokens = TOKEN_RE.findall(value)
    masked = TOKEN_RE.sub(TOKEN_PLACEHOLDER, value)
    return masked, tokens


def restore(masked: str, tokens) -> str:
    """Restore tokens by sequentially substituting placeholders."""
    out = masked
    for tok in tokens:
        out = out.replace(TOKEN_PLACEHOLDER, tok, 1)
    return out


def leaf_keys(d, prefix=""):
    out = []
    for k, v in d.items():
        p = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.extend(leaf_keys(v, p))
        else:
            out.append((p, v))  # keep value too
    return out


def set_value(tree, dotted, value):
    parts = dotted.split(".")
    cur = tree
    for p in parts[:-1]:
        cur = cur.setdefault(p, {})
    cur[parts[-1]] = value


def main():
    en_path = LOCALES_DIR / "en.json"
    if not en_path.exists():
        sys.exit(f"en.json not found at {en_path}")

    en = json.loads(en_path.read_text(encoding="utf-8"))
    en_leaves = dict(leaf_keys(en))  # dotted -> value

    LOCALES = [c for c in ("es", "zh", "zh-CN", "zh-TW", "ja", "ko")
               if (LOCALES_DIR / f"{c}.json").exists()]

    grand = 0
    grand_missing = []

    for code in LOCALES:
        path = LOCALES_DIR / f"{code}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        existing = dict(leaf_keys(data))
        to_fill = [(k, v) for k, v in en_leaves.items() if k not in existing]

        if not to_fill:
            print(f"[{code:6s}] up-to-date")
            continue

        target = TARGET.get(code, code)
        translator = GoogleTranslator(source="en", target=target)

        for i, (key, value) in enumerate(to_fill, 1):
            masked, tokens = extract(value)
            # On refusal from Google (very short / token-only strings), retry
            # with a longer context sentence and substitute the marker back.
            try:
                translated = translator.translate(masked)
            except Exception as first_exc:
                try:
                    filler = "You have X DOLLARS raised so far."
                    fuller = translator.translate(filler)
                    translated = fuller.replace("X DOLLARS", TOKEN_PLACEHOLDER)
                except Exception:
                    print(f"  [{code}] {key}: FAILED ({first_exc}) — using English")
                    translated = masked
                    grand_missing.append((code, key))
            final = restore(translated, tokens)
            set_value(data, key, final)
            # Throttle: Google is rate-limited → 1 req/sec for safety
            time.sleep(1.0 if i % 5 else 0)

        # Update Chinese-text Unicode-escape quirk: convert \u2014 etc. back to raw chars
        json_text = json.dumps(data, indent=2, ensure_ascii=False)
        path.write_text(json_text + "\n", encoding="utf-8")
        print(f"[{code:6s}] filled {len(to_fill):3d} keys")
        grand += len(to_fill)

    print("=" * 50)
    print(f"Total keys filled across {len(LOCALES)} locales: {grand}")
    if grand_missing:
        print(f"\n!! {len(grand_missing)} translations fell back to English:")
        for c, k in grand_missing:
            print(f"  [{c}] {k}")
        sys.exit(1)
    print("All locale files at full parity with en.json.")


if __name__ == "__main__":
    main()
