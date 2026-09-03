#!/usr/bin/env python3
"""Checks that the Onleihe 3.0 API still behaves the way the extension relies on.

Runs against every consortium in shared/libraries.json - about 120, not 2200,
because the libraries are spread across consortia. Full coverage is therefore
affordable.

This is exactly the check that would have caught the migration to Onleihe 3.0:
back then the old search URL stopped returning results and nothing raised an alarm.

  python tools/smoke_api.py            # every consortium
  python tools/smoke_api.py --limit 20 # quick run
"""

import argparse
import json
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

API = "https://api.onleihe.de"
LOGIN = f"{API}/user-application/v1/auth/login"
REPO = Path(__file__).resolve().parent.parent
LIBRARIES = REPO / "shared" / "libraries.json"

WORKERS = 16
TIMEOUT = 40


def post_json(url, payload, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(), headers=headers, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        return e.code, None
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as e:
        return 0, str(e)


def check_tenant(tenant):
    """Fetches a guest token and queries the catalog."""
    onleihe_id, library_id, name = tenant

    status, body = post_json(LOGIN, {"onleiheId": onleihe_id, "libraryId": library_id})
    if status != 200 or not isinstance(body, dict) or "accessToken" not in body:
        return {"name": name, "stage": "login", "status": status, "total": None}

    search_url = f"{API}/ui/v1/onleihe/{onleihe_id}/search?libraryId={library_id}"
    payload = {
        "query": [{"query": "*", "fields": []}],
        "facets": [{"field": "mediaType"}],
        "size": 0,
        "from": 0,
    }
    status, body = post_json(search_url, payload, token=body["accessToken"])
    if status != 200 or not isinstance(body, dict):
        return {"name": name, "stage": "search", "status": status, "total": None}

    return {
        "name": name,
        "stage": "ok",
        "status": 200,
        "total": int(body.get("totalItems") or 0),
    }


def load_tenants():
    if not LIBRARIES.exists():
        sys.exit(f"{LIBRARIES.relative_to(REPO)} is missing - run tools/build_libraries.py first")

    libraries = json.loads(LIBRARIES.read_text(encoding="utf-8"))
    tenants = {}
    for lib in libraries:
        tenants.setdefault(lib["onleiheId"], (lib["onleiheId"], lib["libraryId"], lib["name"]))
    return list(tenants.values())


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--limit", type=int, help="Only check the first N consortia")
    args = ap.parse_args()

    tenants = load_tenants()
    if args.limit:
        tenants = tenants[: args.limit]

    print(f"Checking {len(tenants)} consortia against {API} ...")
    with ThreadPoolExecutor(WORKERS) as ex:
        results = list(ex.map(check_tenant, tenants))

    ok = [r for r in results if r["stage"] == "ok" and (r["total"] or 0) > 0]
    empty = [r for r in results if r["stage"] == "ok" and not r["total"]]
    failed = [r for r in results if r["stage"] != "ok"]

    print(f"\n  catalog present : {len(ok)}/{len(results)}")
    print(f"  API ok, 0 titles: {len(empty)}")
    print(f"  failures        : {len(failed)}")

    for r in failed[:20]:
        print(f"    [{r['stage']} {r['status']}] {r['name']}")
    for r in empty[:20]:
        print(f"    [empty] {r['name']}")

    if failed or empty:
        print("\nFAILED: the API does not behave as expected.")
        return 1

    print("\nOK: every consortium responds as expected.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
