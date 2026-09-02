#!/usr/bin/env python3
"""Erzeugt shared/libraries.json aus der offiziellen Onleihe-3.0-API.

Ersetzt den früheren Selenium-Scraper: die Bibliotheksliste kommt jetzt aus dem
öffentlichen Verzeichnis-Endpunkt, nicht mehr aus dem HTML der Hilfeseite (die
inzwischen 404 liefert).

Zwei Schritte:

1. Verzeichnis paginieren -> Name, Ort, PLZ, onleiheId, libraryId pro Bibliothek.
2. Host-Mapping pro onleiheId aufbauen, damit die Erweiterung einen
   "Im Katalog anzeigen"-Link setzen kann. Der Host ist aus der onleiheId nicht
   rückwärts auflösbar, deshalb vorwärts: bekannte Hosts -> Redirect folgen ->
   /management/v1/auth/domains?host=... -> onleiheId.
"""

import argparse
import json
import re
import sys
import unicodedata
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse

API = "https://api.onleihe.de"
DIRECTORY = f"{API}/user-application/v2/auth/libraries"
DOMAINS = f"{API}/management/v1/auth/domains"
PAGE_SIZE = 50
WORKERS = 16
TIMEOUT = 40

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "shared" / "libraries.json"


def get_json(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return json.load(resp)
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError):
        return None


def fetch_directory():
    """Alle Seiten des Bibliotheksverzeichnisses einsammeln."""
    first = get_json(f"{DIRECTORY}?page=1&size={PAGE_SIZE}")
    if not first:
        sys.exit("Verzeichnis-Endpunkt nicht erreichbar")

    entries = list(first["content"])
    total_pages = first["totalPages"]
    print(f"Verzeichnis: {first['totalItems']} Bibliotheken auf {total_pages} Seiten")

    def page(n):
        d = get_json(f"{DIRECTORY}?page={n}&size={PAGE_SIZE}")
        return d["content"] if d else []

    with ThreadPoolExecutor(WORKERS) as ex:
        for chunk in ex.map(page, range(2, total_pages + 1)):
            entries.extend(chunk)

    if len(entries) < first["totalItems"]:
        print(f"  Warnung: nur {len(entries)} von {first['totalItems']} Einträgen geladen")
    return entries


def resolve_final_host(url):
    """Redirects folgen und den endgültigen Host zurückgeben.

    Die alten baseURLs zeigen auf Onleihe 2.x (www.onleihe.de/<slug>/), das per
    301 auf <slug>.onleihe.de umleitet und dabei den Pfad verwirft.
    """
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "onleihe-checker-build"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return urlparse(resp.url).netloc
    except urllib.error.HTTPError as e:
        return urlparse(e.url).netloc if getattr(e, "url", None) else None
    except (urllib.error.URLError, TimeoutError, ValueError):
        return None


def collect_candidate_hosts(legacy_path):
    """Host-Kandidaten aus den alten Onleihe-2.x-Adressen gewinnen.

    tools/legacy_base_urls.json hält die 229 Adressen aus der Zeit vor der
    Migration. Sie zeigen auf www.onleihe.de/<slug>/ und leiten heute auf den
    neuen Host <slug>.onleihe.de um - genau die Zuordnung, die gebraucht wird.
    """
    if not legacy_path.exists():
        print(f"  Keine Altdaten unter {legacy_path} - Host-Mapping bleibt leer")
        return []

    base_urls = sorted(set(json.loads(legacy_path.read_text(encoding="utf-8"))))
    print(f"Host-Mapping: {len(base_urls)} alte baseURLs werden aufgelöst")

    with ThreadPoolExecutor(WORKERS) as ex:
        hosts = ex.map(resolve_final_host, base_urls)

    candidates = {h for h in hosts if h}
    # Die direkten Hosts der Altdaten mitnehmen: manche antworten ohne Redirect.
    candidates |= {urlparse(u).netloc for u in base_urls}
    return sorted(c for c in candidates if c and ":" not in c)


def slugify(text):
    text = (text or "").lower()
    for src, dst in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        text = text.replace(src, dst)
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "", text)


def slug_host_candidates(entries):
    """Host-Kandidaten aus Bibliotheks- und Ortsnamen ableiten.

    Fängt die Verbünde auf, die in den Altdaten fehlten - vor allem CH/AT/LU,
    die der alte Scraper komplett übersprungen hat.
    """
    candidates = set()
    for entry in entries:
        for source in (entry.get("city"), entry.get("name")):
            for token in re.split(r"[\s/,-]+", source or ""):
                slug = slugify(token)
                if 3 <= len(slug) <= 24:
                    for tld in ("de", "ch", "at"):
                        candidates.add(f"{slug}.onleihe.{tld}")
    return sorted(candidates)


def host_to_onleihe(host):
    entries = get_json(f"{DOMAINS}?host={host}")
    if not entries:
        return None
    web = next((e for e in entries if e.get("type") == "WEB"), entries[0])
    return (web.get("onleiheId"), host) if web.get("onleiheId") else None


def build_host_map(hosts):
    """onleiheId -> Host. Kürzester Host gewinnt, das ist der kanonische."""
    with ThreadPoolExecutor(WORKERS) as ex:
        results = [r for r in ex.map(host_to_onleihe, hosts) if r]

    host_map = {}
    for onleihe_id, host in results:
        current = host_map.get(onleihe_id)
        if current is None or (len(host), host) < (len(current), current):
            host_map[onleihe_id] = host
    print(f"  {len(host_map)} Verbünde einem Host zugeordnet ({len(results)} Treffer)")
    return host_map


# Interne Mandanten des Betreibers, keine echten Bibliotheken.
TEST_TENANT_PATTERNS = (
    re.compile(r"^divibib[\s_-]*t?-?\d*$", re.I),
    re.compile(r"^test\b", re.I),
    re.compile(r"\btest\s+deutschland\b", re.I),
)


def is_test_entry(entry):
    name = (entry.get("name") or "").strip()
    city = (entry.get("city") or "").strip()
    return any(p.search(name) or p.search(city) for p in TEST_TENANT_PATTERNS)


def normalize(entry, host_map):
    onleihe_id = entry.get("onleiheId")
    out = {
        "name": (entry.get("name") or "").strip(),
        "city": (entry.get("city") or "").strip(),
        "postalCode": (entry.get("postalCode") or "").strip(),
        "onleiheId": onleihe_id,
        "libraryId": entry.get("id"),
    }
    host = host_map.get(onleihe_id)
    if host:
        out["host"] = host
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--skip-hosts", action="store_true",
                    help="Host-Mapping überspringen (schnell, aber ohne Katalog-Links)")
    ap.add_argument("--legacy", type=Path, default=REPO / "tools" / "legacy_base_urls.json",
                    help="Alte Onleihe-2.x-Adressen als Host-Kandidatenquelle")
    ap.add_argument("--out", type=Path, default=OUT)
    args = ap.parse_args()

    entries = fetch_directory()

    test_entries = [e for e in entries if is_test_entry(e)]
    entries = [e for e in entries if not is_test_entry(e)]
    if test_entries:
        print(f"  {len(test_entries)} interne Test-Mandanten verworfen")

    host_map = {}
    if not args.skip_hosts:
        hosts = collect_candidate_hosts(args.legacy)
        if hosts:
            host_map = build_host_map(hosts)

        # Verbünde ohne Host über Namens-/Ortsslugs nachziehen.
        unmapped = {e["onleiheId"] for e in entries if e.get("onleiheId") not in host_map}
        if unmapped:
            rest = [e for e in entries if e.get("onleiheId") in unmapped]
            extra_hosts = slug_host_candidates(rest)
            print(f"Host-Mapping: {len(unmapped)} Verbünde offen, {len(extra_hosts)} Slug-Kandidaten")
            extra_map = build_host_map(extra_hosts)
            for onleihe_id, host in extra_map.items():
                host_map.setdefault(onleihe_id, host)

    libraries = [normalize(e, host_map) for e in entries]
    libraries = [lib for lib in libraries if lib["name"] and lib["onleiheId"] and lib["libraryId"]]

    # Exakte Duplikate entfernen; die Altdaten hatten 18 davon.
    seen, unique = set(), []
    for lib in libraries:
        key = (lib["name"], lib["onleiheId"], lib["libraryId"])
        if key not in seen:
            seen.add(key)
            unique.append(lib)

    unique.sort(key=lambda l: (l["name"].casefold(), l["city"].casefold()))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(unique, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    tenants = {l["onleiheId"] for l in unique}
    with_host = sum(1 for l in unique if l.get("host"))
    print(f"\n{len(unique)} Bibliotheken -> {args.out.relative_to(REPO)}")
    print(f"  {len(tenants)} Verbünde, {with_host} Einträge mit Host-Link")
    if len(libraries) != len(unique):
        print(f"  {len(libraries) - len(unique)} exakte Duplikate entfernt")


if __name__ == "__main__":
    main()
