#!/usr/bin/env python3
"""Prüft, ob die Onleihe-3.0-API noch so funktioniert, wie die Erweiterung sie nutzt.

Läuft gegen jeden Verbund in shared/libraries.json - das sind rund 120, nicht
2200, weil sich die Bibliotheken auf Verbünde verteilen. Vollabdeckung ist
deshalb bezahlbar.

Genau diese Prüfung hätte die Migration auf Onleihe 3.0 bemerkt: damals hörte
die alte Such-URL auf, Ergebnisse zu liefern, ohne dass irgendetwas Alarm schlug.

  python tools/smoke_api.py            # alle Verbünde
  python tools/smoke_api.py --limit 20 # Schnelldurchlauf
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
    """Gast-Token holen und den Katalog abfragen."""
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
        sys.exit(f"{LIBRARIES.relative_to(REPO)} fehlt - erst tools/build_libraries.py ausführen")

    libraries = json.loads(LIBRARIES.read_text(encoding="utf-8"))
    tenants = {}
    for lib in libraries:
        tenants.setdefault(lib["onleiheId"], (lib["onleiheId"], lib["libraryId"], lib["name"]))
    return list(tenants.values())


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--limit", type=int, help="Nur die ersten N Verbünde prüfen")
    args = ap.parse_args()

    tenants = load_tenants()
    if args.limit:
        tenants = tenants[: args.limit]

    print(f"Prüfe {len(tenants)} Verbünde gegen {API} ...")
    with ThreadPoolExecutor(WORKERS) as ex:
        results = list(ex.map(check_tenant, tenants))

    ok = [r for r in results if r["stage"] == "ok" and (r["total"] or 0) > 0]
    empty = [r for r in results if r["stage"] == "ok" and not r["total"]]
    failed = [r for r in results if r["stage"] != "ok"]

    print(f"\n  Katalog vorhanden : {len(ok)}/{len(results)}")
    print(f"  API ok, 0 Titel   : {len(empty)}")
    print(f"  Fehler            : {len(failed)}")

    for r in failed[:20]:
        print(f"    [{r['stage']} {r['status']}] {r['name']}")
    for r in empty[:20]:
        print(f"    [leer] {r['name']}")

    if failed or empty:
        print("\nFEHLGESCHLAGEN: Die API verhält sich nicht wie erwartet.")
        return 1

    print("\nOK: alle Verbünde antworten wie erwartet.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
