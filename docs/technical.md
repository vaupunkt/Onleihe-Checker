---
layout: default
title: Technische Details
---

# ⚙️ Technische Details

## Projektstruktur

```
root/
├── shared/            gemeinsamer Quellcode für Chrome und Firefox
│   ├── browser-api.js     wählt den Promise-Namespace
│   ├── i18n.js            Übersetzungen DE/EN
│   ├── onleihe-api.js     Zugriff auf die Onleihe-3.0-API
│   ├── background.js      vermittelt die Abfrage
│   ├── content.js         liest die Buchseite, zeigt das Statusfeld
│   ├── popup.js/.html     Bibliothekswahl
│   └── libraries.json     erzeugt, nicht von Hand pflegen
├── platform/          manifest.chrome.json, manifest.firefox.json (beide MV3)
├── tools/             Build, Datenaufbau, Tests
└── dist/              Build-Ausgabe (nicht eingecheckt)
```

Beide Builds entstehen aus derselben Quelle; nur die Manifeste unterscheiden sich.

## Die Onleihe-3.0-API

Onleihe hat auf eine React-SPA umgestellt. Die Suchseite liefert kein Ergebnis-Markup mehr, die
Trefferzahl lässt sich also nicht aus dem HTML lesen – die Erweiterung spricht deshalb direkt die
JSON-API der Web-App an. Ein **Gast-Token** genügt, es ist kein Bibliothekskonto nötig.

Basis: `https://api.onleihe.de`

| Zweck | Aufruf |
|---|---|
| Gast-Token | `POST /user-application/v1/auth/login` mit `{onleiheId, libraryId}` |
| Suche | `POST /ui/v1/onleihe/{onleiheId}/search?libraryId=…` |
| Verzeichnis | `GET /user-application/v2/auth/libraries` |

`onleiheId` und `libraryId` müssen zwischen Token und Suchanfrage zusammenpassen; die `libraryId`
steckt als `lid` im Token. Ein Token ohne `libraryId`, dessen `?libraryId=` an der Suche
mitgeschickt wird, führt zu `401`.

### Suchanfrage

```json
{
  "query":  [{ "query": "Der Steppenwolf Hesse", "fields": [] }],
  "facets": [{ "field": "mediaType" }],
  "size": 10,
  "from": 0
}
```

Freitext (`fields: []`) – feldgebundene Abfragen liefern leere Antworten. Mehrere Wörter werden
serverseitig UND-verknüpft, der Suchbegriff aus Titel und Autor-Nachname verengt also sinnvoll.

### Antwort

```json
{
  "totalItems": 8,
  "content": [{
    "productId": "…",
    "product": { "title": "Der Steppenwolf", "authors": [ … ], "mediaType": "E_BOOK" },
    "status":  { "availabilityInformation": { "isAvailable": true, "availability": 1 },
                 "reservable": false, "nextAvailabilityDate": null }
  }],
  "facets": [{ "facetField": "mediaType", "values": [ … ] }]
}
```

`availabilityInformation.isAvailable` erlaubt die Unterscheidung zwischen **sofort ausleihbar** und
**verliehen, vormerkbar** – die Erweiterung zeigt nicht bloß eine Trefferzahl.

## Deep-Links in den Katalog

Die Routen und Parameternamen stammen aus der Linking-Konfiguration der Onleihe-Web-App:

| Ziel | Adresse |
|---|---|
| Trefferliste | `https://<host>/search?searchTerm=…` |
| Einzeltitel | `https://<host>/search/mediadetail?productId=…` |

Der Host ist aus der `onleiheId` nicht rückwärts auflösbar und wird beim Datenaufbau ermittelt. Für
Verbünde ohne bekannten Host entfällt allein der Link, nicht die Prüfung.

## Datenaufbau

`tools/build_libraries.py` erzeugt `shared/libraries.json`:

1. Verzeichnis-Endpunkt paginieren → Name, Ort, PLZ, `onleiheId`, `libraryId`.
2. Interne Test-Mandanten des Betreibers verwerfen.
3. Host je Verbund bestimmen: die alten Onleihe-2.x-Adressen aus `tools/legacy_base_urls.json`
   ihren Redirects folgen (`www.onleihe.de/<slug>/` → `<slug>.onleihe.de`), dann
   `GET /management/v1/auth/domains?host=…`. Offene Verbünde über Slugs aus Bibliotheks- und
   Ortsnamen nachziehen.

Nur die Standardbibliothek von Python 3.9+ – kein Selenium, kein chromedriver.

## Absicherung

| Befehl | Prüft |
|---|---|
| `npm test` | reine Funktionen und `content.js` gegen ein simuliertes DOM |
| `npm run smoke` | Gast-Token und Suche gegen **jeden** Verbund der echten API |
| `npm run lint:firefox` | `web-ext lint` auf dem Firefox-Paket |

Der Smoke-Test läuft wöchentlich in der CI – als Stichprobe über 15 Verbünde, weil eine
API-Änderung global ist und eine Stichprobe sie genauso erkennt. Vollabdeckung lokal mit
`npm run smoke` oder per `workflow_dispatch`. Genau diese Prüfung hätte die Migration auf
Onleihe 3.0 bemerkt, die die Erweiterung zuvor unbemerkt lahmgelegt hat.

`tools/build_libraries.py` läuft bewusst **nicht** in der CI: es ist der einzige Teil des Projekts
mit Bulk-Zugriff und für seltene, bewusste Läufe gedacht.
