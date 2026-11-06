#!/usr/bin/env bash
# Builds the store packages for Chrome and Firefox into release/.
#   release/chrome/                         unpacked Chrome extension
#   release/firefox/                        unpacked Firefox extension
#   release/onleihe-checker-chrome-<v>.zip  upload for the Chrome Web Store
#   release/onleihe-checker-firefox-<v>.zip upload for addons.mozilla.org
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/release"
FILES=(manifest.json background.js sunset.html sunset.js icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png)

rm -rf "$OUT"
mkdir -p "$OUT"

build() {
    local target="$1" src="$2"
    local version
    version="$(jq -r .version "$src/manifest.json")"
    mkdir -p "$OUT/$target/icons"
    for f in "${FILES[@]}"; do
        cp "$src/$f" "$OUT/$target/$f"
    done
    (cd "$OUT/$target" && zip -qrX "$OUT/onleihe-checker-$target-$version.zip" "${FILES[@]}")
    echo "✔ $target $version → release/onleihe-checker-$target-$version.zip"
}

build chrome "$ROOT/OnleiheChecker"
build firefox "$ROOT/OnleiheChecker_firefox"

"$ROOT/tests/verify.sh" "$OUT/chrome" "$OUT/firefox"
