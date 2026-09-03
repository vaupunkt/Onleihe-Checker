---
layout: default
title: Problemlösung
---

# 🐛 Problemlösung

## Nutzung

### Kein Statusfeld auf einer Amazon-Seite
Die Adresse muss `/dp/` oder `/gp/product/` enthalten, bei Goodreads `/book/show/`. Danach prüft
die Erweiterung, ob es wirklich ein Buch ist – über **vier** unabhängige Signale:
Kategorie-Navigation (`books-catalog` für Druck, `digital-text` für Kindle), Kindle-Titelelement,
Breadcrumb („Bücher", „Kindle-Shop") oder buchspezifische Detailfelder (ISBN, Verlag, Seitenzahl).
Greift keines, erscheint absichtlich nichts.

Bis Version 1.2 hing das an einer einzigen Bedingung, `books-catalog` – bei **Kindle-Ausgaben** ist
diese Kategorie `digital-text`, dort erschien das Feld deshalb nie.

Zum Messen statt Raten: [`tools/diagnose-page.js`](https://github.com/vaupunkt/Onleihe-Checker/blob/main/tools/diagnose-page.js)
in die Browser-Konsole der betroffenen Seite einfügen. Die Ausgabe zeigt pro Signal, was gefunden
wurde, und ob die Seite erkannt würde.

### „Bitte wähle deine Onleihe-Bibliothek"
Im Popup ist noch keine Bibliothek gespeichert. Symbol anklicken, Bibliothek suchen, **speichern**.
Das Auswählen allein genügt nicht.

### „Nicht im Onleihe-Katalog vorhanden"
Das ist meist keine Störung, sondern eine echte Katalog-Lücke: kleinere Verbünde führen viele Titel
nicht. Kontrolle über den Link „Direkt im Onleihe-Katalog suchen".

Möglich ist auch ein zu enger Suchbegriff – gesucht wird mit Titel und Autor-Nachname, und die
Onleihe verknüpft mehrere Wörter mit UND. Bei Sammelbänden oder abweichenden Ausgabetiteln kann das
ins Leere laufen.

### „Onleihe-Abfrage fehlgeschlagen"
Ein tatsächlicher Fehler; der Statuscode steht in der Meldung. Zum Nachprüfen:

```bash
npm run smoke
```

Das prüft Gast-Token und Suche gegen jeden Verbund. Schlägt es flächendeckend fehl, hat sich die
Onleihe-API geändert.

### Kein „Im Katalog anzeigen"-Link
Für diesen Verbund ist kein Katalog-Host bekannt. Die Verfügbarkeitsprüfung funktioniert trotzdem,
nur der Deep-Link entfällt. `npm run libraries` kann die Zuordnung neu ermitteln.

### Falsche Sprache
Ohne gespeicherte Auswahl folgt die Erweiterung der Browsersprache. Im Popup lässt sie sich
umstellen; offene Buchseiten übernehmen den Wechsel sofort.

## Entwicklung

### Erweiterung lädt nicht
- Chrome: `chrome://extensions` → Entwicklermodus → *Entpackte Erweiterung laden* → `dist/chrome`
- Firefox: `npx web-ext run --source-dir dist/firefox`
- Nach Änderungen in `shared/` erst `npm run build` – geladen wird `dist/`, nicht `shared/`.

### Änderungen wirken nicht
Bearbeite `shared/`, nicht `dist/`. Letzteres wird bei jedem Build überschrieben.

### `undefined` aus einem API-Aufruf in Firefox
Immer `OnleiheBrowser` verwenden, nicht `chrome.*`. In Firefox ist der `chrome`-Namespace
callback-basiert; ein `await` darauf liefert stillschweigend `undefined`.

### Tests hängen
`content.js` beobachtet per Intervall die Adresse. Im Testharness muss das Fenster nach dem
Auslesen geschlossen werden, sonst halten dessen Timer die Eventloop offen.
