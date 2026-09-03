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
npm run smoke          # prüft die echte Onleihe-API (alle Verbünde; --sample N für weniger)
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
| Kein Statusfeld auf einer Amazon-Seite | Keine Buchseite erkannt. Diagnose: `tools/diagnose-page.js` in die Browser-Konsole einfügen – zeigt pro Signal, was fehlt. |
| „Bitte wähle deine Onleihe-Bibliothek" | Im Popup noch keine Bibliothek gespeichert. |
| „Nicht im Onleihe-Katalog vorhanden" | Echte Katalog-Lücke, kein Fehler. Kleinere Verbünde haben viele Titel nicht. |
| „Onleihe-Abfrage fehlgeschlagen" | API-Problem – Statuscode steht in der Meldung. `npm run smoke` prüft alle Verbünde. |
| Kein „Im Katalog anzeigen"-Link | Für diesen Verbund ist kein Host bekannt; die Prüfung selbst funktioniert. |

## Lizenz

MIT

## Rechtliche Einordnung

**Ungeklärt — vor einer Store-Veröffentlichung zu prüfen.** Die genutzte API ist die Backend-
Schnittstelle der öffentlichen Onleihe-Web-App. Es wird nichts umgangen: kein Login, keine
Zugangsdaten, keine Schutzmaßnahme. Das Gast-Token stellt Onleihe anonymen Besuchern selbst aus.

Es gibt aber **keine dokumentierte öffentliche API und keine Nutzungserlaubnis**, und der API-Host
untersagt automatisierten Zugriff ausdrücklich:

```
$ curl https://api.onleihe.de/robots.txt
User-agent: *
Disallow: /
```

robots.txt ist kein Gesetz und richtet sich an Crawler, nicht an ein Programm, das auf
ausdrückliche Nutzeranweisung handelt. Es ist aber ein klares Signal des Betreibers. Zwei Fälle
sind dabei zu trennen:

| | Exponierung |
|---|---|
| **Laufzeit** (`onleihe-api.js`): eine Suchanfrage pro Buchseite, vom Nutzer ausgelöst | gering — funktional dasselbe, als tippe der Nutzer den Titel in die Onleihe-Suche |
| **Build** (`tools/build_libraries.py`): 45 Verzeichnisseiten plus Host-Sondierungen | höher — genau der Bulk-Zugriff, den robots.txt adressiert; berührt zudem das Datenbankherstellerrecht (§ 87b UrhG) |

Der Bulk-Zugriff passiert **einmalig beim Maintainer**, nicht in den Browsern der Nutzer, und
`tools/build_libraries.py` läuft bewusst **nicht** in der CI. Zur Zurückhaltung:

- Die Build-Werkzeuge senden einen **identifizierenden User-Agent** statt sich als Browser zu
  tarnen — divibib kann den Verkehr zuordnen und bei Bedarf sperren.
- Nur 6 parallele Verbindungen, nicht 16.
- Der wöchentliche CI-Lauf prüft eine **Stichprobe von 15 Verbünden**, nicht alle 123. Eine
  API-Änderung ist global, eine Stichprobe erkennt sie genauso — bei einem Bruchteil der Anfragen.
  Vollabdeckung gibt es lokal oder per `workflow_dispatch`.
- Das Verzeichnis ändert sich langsam; `npm run libraries` ist für seltene, bewusste Läufe gedacht.

Das Skript liegt offen im Repo, und das ist Absicht. Die API ist kein Geheimnis — sie steht in den
JavaScript-Bundles, die jeder Besucher der Onleihe-Web-App lädt. Ein verstecktes Bulk-Skript
schützte niemanden, machte `libraries.json` aber zu einem nicht reproduzierbaren, nicht prüfbaren
Datenklumpen. Genau so sind die alten Daten unbemerkt verrottet.

## Haftungsausschluss

Unabhängiges Projekt, weder von der divibib GmbH noch von Amazon oder Goodreads unterstützt oder
geprüft. „Onleihe" ist eine Marke der divibib GmbH.
