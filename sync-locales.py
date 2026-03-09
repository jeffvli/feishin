#!/usr/bin/env python3
"""Sync all locale JSON files against en.json (strict sync, minimal diff).

- Existing translated keys keep their original position and value.
- Keys present in en.json but missing from the locale are appended at the
  end of the same nesting level (easy to spot for translators).
- Keys absent from en.json are removed.
"""

import json
from pathlib import Path

LOCALES_DIR = Path(__file__).resolve().parent / "src" / "i18n" / "locales"
BASE_FILE = LOCALES_DIR / "en.json"

def sync(base: dict, target: dict) -> dict:
    result = {}

    # 1. Walk existing keys in target order, keep those still in base
    for key in target:
        if key not in base:
            continue
        if isinstance(base[key], dict):
            result[key] = sync(base[key], target.get(key, {}))
        else:
            result[key] = target[key]

    # 2. Append missing keys (in en.json order) at the end
    for key in base:
        if key not in result:
            if isinstance(base[key], dict):
                result[key] = sync(base[key], {})
            else:
                result[key] = base[key]

    return result

def main():
    with open(BASE_FILE, "r", encoding="utf-8") as f:
        base = json.load(f)

    for filepath in sorted(LOCALES_DIR.glob("*.json")):
        if filepath.name == "en.json":
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            target = json.load(f)

        synced = sync(base, target)

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(synced, f, ensure_ascii=False, indent=4)
            f.write("\n")

        print(f"synced {filepath.name}")

if __name__ == "__main__":
    main()
