#!/usr/bin/env python3
"""Builds shared/libraries.json from the official Onleihe 3.0 API.

Run this rarely - the library directory changes slowly, and this is the only
part of the project that makes bulk requests.
See the README before running it against anything but your own maintenance needs.

Two steps:

1. Paginate the directory -> name, city, postal code, onleiheId, libraryId per library.
2. Build a host mapping per onleiheId so the extension can offer a
   "show in catalog" link. The host cannot be resolved backwards from the
   onleiheId, so go forwards instead: known hosts -> follow redirect ->
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
WORKERS = 6  # Deliberately low: this is somebody else's API.
TIMEOUT = 40

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "shared" / "libraries.json"


# Identify this tool in every request instead of posing as a browser, so the
# operator can attribute and, if they wish, block the traffic. Note that
# api.onleihe.de serves "User-agent: * / Disallow: /" - see README.
USER_AGENT = "onleihe-checker-build (+https://github.com/vaupunkt/Onleihe-Checker)"


def get_json(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return json.load(resp)
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError):
        return None


def fetch_directory():
    """Collects every page of the library directory."""
    first = get_json(f"{DIRECTORY}?page=1&size={PAGE_SIZE}")
    if not first:
        sys.exit("Directory endpoint unreachable")

    entries = list(first["content"])
    total_pages = first["totalPages"]
    print(f"Directory: {first['totalItems']} libraries across {total_pages} pages")

    def page(n):
        d = get_json(f"{DIRECTORY}?page={n}&size={PAGE_SIZE}")
        return d["content"] if d else []

    with ThreadPoolExecutor(WORKERS) as ex:
        for chunk in ex.map(page, range(2, total_pages + 1)):
            entries.extend(chunk)

    if len(entries) < first["totalItems"]:
        print(f"  Warning: only loaded {len(entries)} of {first['totalItems']} entries")
    return entries


def resolve_final_host(url):
    """Follows redirects and returns the final host.

    The old baseURLs point at Onleihe 2.x (www.onleihe.de/<slug>/), which 301s to
    <slug>.onleihe.de and drops the path along the way.
    """
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return urlparse(resp.url).netloc
    except urllib.error.HTTPError as e:
        return urlparse(e.url).netloc if getattr(e, "url", None) else None
    except (urllib.error.URLError, TimeoutError, ValueError):
        return None


def collect_candidate_hosts(legacy_path):
    """Derives host candidates from the old Onleihe 2.x addresses.

    tools/legacy_base_urls.json holds the 229 addresses from before the migration.
    They point at www.onleihe.de/<slug>/ and today redirect to the new host
    <slug>.onleihe.de - exactly the mapping that is needed here.
    """
    if not legacy_path.exists():
        print(f"  No legacy data at {legacy_path} - host mapping stays empty")
        return []

    base_urls = sorted(set(json.loads(legacy_path.read_text(encoding="utf-8"))))
    print(f"Host mapping: resolving {len(base_urls)} legacy baseURLs")

    with ThreadPoolExecutor(WORKERS) as ex:
        hosts = ex.map(resolve_final_host, base_urls)

    candidates = {h for h in hosts if h}
    # Include the legacy hosts as-is: some answer without a redirect.
    candidates |= {urlparse(u).netloc for u in base_urls}
    return sorted(c for c in candidates if c and ":" not in c)


def slugify(text):
    text = (text or "").lower()
    for src, dst in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        text = text.replace(src, dst)
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "", text)


def slug_host_candidates(entries):
    """Derives host candidates from library and city names.

    Catches the consortia missing from the legacy data - above all CH/AT/LU,
    which the old scraper skipped entirely.
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
    """onleiheId -> host. The shortest host wins, that is the canonical one."""
    with ThreadPoolExecutor(WORKERS) as ex:
        results = [r for r in ex.map(host_to_onleihe, hosts) if r]

    host_map = {}
    for onleihe_id, host in results:
        current = host_map.get(onleihe_id)
        if current is None or (len(host), host) < (len(current), current):
            host_map[onleihe_id] = host
    print(f"  mapped {len(host_map)} consortia to a host ({len(results)} matches)")
    return host_map


# The operator's internal tenants, not real libraries.
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
                    help="Skip the host mapping (fast, but without catalog links)")
    ap.add_argument("--legacy", type=Path, default=REPO / "tools" / "legacy_base_urls.json",
                    help="Old Onleihe 2.x addresses used as host candidates")
    ap.add_argument("--out", type=Path, default=OUT)
    args = ap.parse_args()

    entries = fetch_directory()

    test_entries = [e for e in entries if is_test_entry(e)]
    entries = [e for e in entries if not is_test_entry(e)]
    if test_entries:
        print(f"  discarded {len(test_entries)} internal test tenants")

    host_map = {}
    if not args.skip_hosts:
        hosts = collect_candidate_hosts(args.legacy)
        if hosts:
            host_map = build_host_map(hosts)

        # Fill in consortia without a host via name/city slugs.
        unmapped = {e["onleiheId"] for e in entries if e.get("onleiheId") not in host_map}
        if unmapped:
            rest = [e for e in entries if e.get("onleiheId") in unmapped]
            extra_hosts = slug_host_candidates(rest)
            print(f"Host mapping: {len(unmapped)} consortia left, {len(extra_hosts)} slug candidates")
            extra_map = build_host_map(extra_hosts)
            for onleihe_id, host in extra_map.items():
                host_map.setdefault(onleihe_id, host)

    libraries = [normalize(e, host_map) for e in entries]
    libraries = [lib for lib in libraries if lib["name"] and lib["onleiheId"] and lib["libraryId"]]

    # Drop exact duplicates; the legacy data contained 18 of them.
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
    # --out may point outside the repo, where relative_to() would raise.
    try:
        shown = args.out.relative_to(REPO)
    except ValueError:
        shown = args.out
    print(f"\n{len(unique)} libraries -> {shown}")
    print(f"  {len(tenants)} consortia, {with_host} entries with a host link")
    if len(libraries) != len(unique):
        print(f"  removed {len(libraries) - len(unique)} exact duplicates")


if __name__ == "__main__":
    main()
