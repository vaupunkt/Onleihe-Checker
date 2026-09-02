# Onleihe Checker

![OnleiheChecker - PopUp Window](assets/174_1x_shots_so.png)

Browser-Erweiterung für Chrome und Firefox: zeigt beim Stöbern auf **Amazon.de** und
**Goodreads** direkt auf der Buchseite an, ob der Titel in deiner **Onleihe** verfügbar ist.

Nicht nur, *ob* er im Katalog steht – sondern ob er **gerade ausleihbar** oder **verliehen und
vormerkbar** ist.

## Installation

| Browser | Store |
|---|---|
| Chrome | [Chrome Web Store](https://chromewebstore.google.com/detail/onleihe-checker/lbdbelkkmbogfjkeklmpfaijgpdnnncn?hl=de) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/de/firefox/addon/onleihechecker/) |

Nach der Installation einmal auf das Symbol klicken, die eigene Bibliothek suchen und speichern.
Es stehen **2232 Bibliotheken** in Deutschland, Österreich, der Schweiz und Luxemburg zur Wahl.

## Wie es funktioniert

```
Amazon-/Goodreads-Buchseite
        │  Titel + Autor auslesen
        ▼
content.js ──► background.js ──► api.onleihe.de
        │                          Gast-Token + Suche
        ◄──────────────────────────┘
        │  Treffer + Verfügbarkeit
        ▼
   Statusfeld auf der Seite
```

Die Erweiterung nutzt die JSON-API von Onleihe 3.0. Ein **Gast-Token** genügt – es ist **kein
Bibliothekskonto und keine Anmeldung** nötig, und es werden keine Zugangsdaten verarbeitet.

Verwendete Endpunkte:

| Zweck | Aufruf |
|---|---|
| Gast-Token | `POST /user-application/v1/auth/login` mit `{onleiheId, libraryId}` |
| Suche | `POST /ui/v1/onleihe/{onleiheId}/search?libraryId=…` |
| Bibliotheksverzeichnis (nur im Build) | `GET /user-application/v2/auth/libraries` |

`onleiheId` und `libraryId` müssen zwischen Token und Suchanfrage zusammenpassen – ein Token ohne
`libraryId`, dessen `?libraryId=` an der Suche mitgeschickt wird, wird mit `401` abgelehnt.

## Berechtigungen

Bewusst knapp gehalten:

| Berechtigung | Wofür |
|---|---|
| `storage` | gewählte Bibliothek und Sprache lokal merken |
| `https://api.onleihe.de/*` | die Verfügbarkeitsabfrage |
| `https://*.amazon.de/*`, `https://*.goodreads.com/*` | Buchdaten auf der Seite lesen und das Statusfeld einfügen |

Das Content-Script läuft **nur auf Buchseiten** (`/dp/`, `/gp/product/`, `/book/show/`), nicht auf
allen Seiten dieser Domains. Es werden keine Daten an Dritte außer Onleihe gesendet; übertragen wird
allein der Suchbegriff aus Titel und Autor.

## Entwicklung

```bash
npm install
npm run build          # -> dist/chrome/, dist/firefox/ + Archive
npm test               # Unit- und DOM-Integrationstests
npm run smoke          # prüft die echte Onleihe-API (alle Verbünde)
npm run lint:firefox   # web-ext lint
```

Laden zum Testen: in Chrome `chrome://extensions` → *Entpackte Erweiterung laden* → `dist/chrome`.
In Firefox `npx web-ext run --source-dir dist/firefox`.

### Aufbau

```
shared/       gemeinsamer Quellcode beider Builds
  browser-api.js   wählt den Promise-Namespace (chrome.* / browser.*)
  i18n.js          Übersetzungen, DE/EN, zur Laufzeit umschaltbar
  onleihe-api.js   Zugriff auf die Onleihe-3.0-API
  background.js    vermittelt die Abfrage
  content.js       liest die Buchseite, zeigt das Statusfeld
  popup.js/.html   Bibliothekswahl
  libraries.json   erzeugt, nicht von Hand pflegen
platform/     manifest.chrome.json (MV3), manifest.firefox.json (MV3)
tools/        Build, Datenaufbau, Tests
dist/         Build-Ausgabe (nicht eingecheckt)
```

Chrome und Firefox teilen denselben Code; nur die Manifeste unterscheiden sich. Änderungen also
immer in `shared/` – nie in `dist/`.

Immer über `OnleiheBrowser` auf die Erweiterungs-APIs zugreifen, nie direkt über `chrome.*` oder
`browser.*`: in Firefox ist `chrome.*` callback-basiert, ein `await` darauf liefert stillschweigend
`undefined`.

### Bibliotheksdaten aktualisieren

```bash
npm run libraries      # python3 tools/build_libraries.py
```

Holt das Verzeichnis von der API, verwirft interne Test-Mandanten und ordnet jedem Verbund den
Katalog-Host zu (für den „Im Katalog anzeigen"-Link). Der Host ist aus der `onleiheId` nicht
rückwärts auflösbar, deshalb löst das Skript die alten Onleihe-2.x-Adressen aus
`tools/legacy_base_urls.json` über deren Redirects auf und ergänzt Kandidaten aus Bibliotheks- und
Ortsnamen. Verbünde ohne bekannten Host funktionieren weiterhin – nur der Deep-Link entfällt.

### Version anheben

Die Version steht in `platform/manifest.chrome.json`, `platform/manifest.firefox.json` und
`package.json`. Die Archivnamen leitet `tools/build.sh` daraus ab.

## Fehlersuche

| Symptom | Ursache |
|---|---|
| Kein Statusfeld auf einer Amazon-Seite | Es ist keine Buchseite – die Erweiterung prüft die Kategorie-Navigation (`books-catalog`). |
| „Bitte wähle deine Onleihe-Bibliothek" | Im Popup noch keine Bibliothek gespeichert. |
| „Nicht im Onleihe-Katalog vorhanden" | Echte Katalog-Lücke, kein Fehler. Kleinere Verbünde haben viele Titel nicht. |
| „Onleihe-Abfrage fehlgeschlagen" | API-Problem – Statuscode steht in der Meldung. `npm run smoke` prüft alle Verbünde. |
| Kein „Im Katalog anzeigen"-Link | Für diesen Verbund ist kein Host bekannt; die Prüfung selbst funktioniert. |

## Lizenz

MIT

## Haftungsausschluss

Unabhängiges Projekt, weder von der divibib GmbH noch von Amazon oder Goodreads unterstützt oder
geprüft. „Onleihe" ist eine Marke der divibib GmbH. Die Erweiterung nutzt die öffentlich
erreichbare API der Onleihe-Web-App im Rahmen des normalen Katalogzugriffs.
