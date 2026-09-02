#!/usr/bin/env bash
# Baut die Erweiterung für Chrome und Firefox aus shared/ + platform/.
#
# Ersetzt das frühere package_firefox.sh (das die Version hartcodiert hatte und
# kein Chrome-Gegenstück besaß). Die Version steht nur noch in den Manifesten.
#
#   tools/build.sh              # beide Ziele bauen und packen
#   tools/build.sh chrome       # nur Chrome
#   tools/build.sh --no-zip     # nur dist/, ohne Archive

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHARED="$REPO/shared"
PLATFORM="$REPO/platform"
DIST="$REPO/dist"

make_zip=true
targets=()

for arg in "$@"; do
    case "$arg" in
        --no-zip) make_zip=false ;;
        chrome|firefox) targets+=("$arg") ;;
        *) echo "Unbekanntes Argument: $arg" >&2; exit 2 ;;
    esac
done

if [ ${#targets[@]} -eq 0 ]; then
    targets=(chrome firefox)
fi

require_file() {
    if [ ! -f "$1" ]; then
        echo "Fehlt: ${1#$REPO/}" >&2
        exit 1
    fi
}

require_file "$SHARED/libraries.json"
require_file "$SHARED/content.js"
require_file "$SHARED/background.js"

read_version() {
    python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['version'])" "$1"
}

build() {
    local target="$1"
    local manifest="$PLATFORM/manifest.$target.json"
    local out="$DIST/$target"

    require_file "$manifest"

    rm -rf "$out"
    mkdir -p "$out"

    # Nur die Laufzeitdateien kopieren, keine Tests oder Notizen.
    cp "$SHARED"/*.js "$SHARED"/*.html "$SHARED"/libraries.json "$out/"
    cp -R "$SHARED/icons" "$out/icons"
    cp -R "$SHARED/_locales" "$out/_locales"
    cp "$manifest" "$out/manifest.json"

    local version
    version="$(read_version "$manifest")"

    printf '%-8s v%-8s %s\n' "$target" "$version" "${out#$REPO/}"

    if [ "$make_zip" = true ]; then
        mkdir -p "$DIST"
        local archive
        if [ "$target" = firefox ]; then
            archive="$DIST/onleihe-checker-firefox-$version.xpi"
        else
            archive="$DIST/onleihe-checker-chrome-$version.zip"
        fi
        rm -f "$archive"
        (cd "$out" && zip -qr "$archive" .)
        printf '%-8s %s\n' "" "${archive#$REPO/}"
    fi
}

for target in "${targets[@]}"; do
    build "$target"
done
