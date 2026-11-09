#!/usr/bin/env bash
# Verifies the sunset release.
# Without arguments it checks the source folders; with arguments it checks the given build
# folders (Chrome first, then Firefox).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="${1:-$ROOT/OnleiheChecker}"
FIREFOX="${2:-$ROOT/OnleiheChecker_firefox}"

failures=0
ok()   { echo "  ✔ $1"; }
fail() { echo "  ✘ $1"; failures=$((failures + 1)); }
check() { if eval "$2"; then ok "$1"; else fail "$1"; fi; }

ONLEIHE_PATTERN='onleihe\.(de|net|ch|at|be|fr|it|lu|li)|divibib|metropolbib|ostalb-onleihe|franken-onleihe|leo-(sued|nord)|enio24|digibobb|biblioload|biblioplus|e-medien-franken|e-ausleihe-franken|emedienbayern|ebook\.baden|elbe-elster-bibnet|onleihe-oberlausitz'
NETWORK_PATTERN='fetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts|https?://'

for dir in "$CHROME" "$FIREFOX"; do
    m="$dir/manifest.json"
    echo "▶ $dir"
    check "manifest.json is valid JSON" "jq empty '$m' 2>/dev/null"
    check "Only permission is \"storage\"" "[ \"\$(jq -c .permissions '$m')\" = '[\"storage\"]' ]"
    check "No host_permissions / optional_permissions" "[ \"\$(jq -c '[.host_permissions, .optional_permissions, .optional_host_permissions] | map(select(. != null))' '$m')\" = '[]' ]"
    check "No content_scripts / web_accessible_resources" "[ \"\$(jq -c '[.content_scripts, .web_accessible_resources] | map(select(. != null))' '$m')\" = '[]' ]"
    check "Popup is the notice page" "[ \"\$(jq -r '(.action // .browser_action).default_popup' '$m')\" = sunset.html ]"
    check "No Onleihe domains" "! grep -rIiqE '$ONLEIHE_PATTERN' '$dir'"
    check "No network APIs or external URLs" "! grep -rIqE '$NETWORK_PATTERN' '$dir'"
    check "Only expected files" "[ \"\$(cd '$dir' && find . -type f ! -name .DS_Store | sort | tr '\n' ' ')\" = './background.js ./icons/icon128.png ./icons/icon16.png ./icons/icon32.png ./icons/icon48.png ./manifest.json ./sunset.html ./sunset.js ' ]"
    check "background.js clears storage on update" "grep -q \"'update'\" '$dir/background.js' && grep -q 'clear()' '$dir/background.js'"
    for f in background.js sunset.js; do
        check "$f has valid syntax" "node --check '$dir/$f' 2>/dev/null"
    done
done

echo "▶ Chrome and Firefox"
check "Same version in both manifests" "[ \"\$(jq -r .version '$CHROME/manifest.json')\" = \"\$(jq -r .version '$FIREFOX/manifest.json')\" ]"
for f in background.js sunset.html sunset.js; do
    check "$f is identical" "cmp -s '$CHROME/$f' '$FIREFOX/$f'"
done
check "Chrome uses Manifest V3" "[ \"\$(jq .manifest_version '$CHROME/manifest.json')\" = 3 ]"

echo
if [ "$failures" -eq 0 ]; then
    echo "All checks passed."
else
    echo "$failures check(s) failed."
    exit 1
fi
