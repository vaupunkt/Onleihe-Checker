---
layout: default
title: Problemlösung
---

# 🐛 Problemlösung

## „Keine Ergebnisse gefunden" bei jeder Bibliothek

Das ist derzeit **kein Konfigurationsfehler**, sondern die Umstellung auf Onleihe 3.0: die
Suchseite liefert ihre Ergebnisse nicht mehr im HTML mit, die Erweiterung kann sie deshalb nicht
auslesen. Betroffen ist Version 1.2 in beiden Stores.

Es hilft weder eine andere Bibliothek noch eine Neuinstallation.

## Scraper-Probleme

> **Hinweis:** Der Scraper läuft nicht mehr – die Hilfeseite, die er ausliest, wurde entfernt und
> antwortet mit 404. Die folgenden Hinweise betreffen nur den historischen Stand.

### ChromeDriver nicht gefunden
```bash
# macOS
brew install chromedriver

# Oder expliziten Pfad setzen:
service = Service('/usr/local/bin/chromedriver')
```

### Cookie-Banner nicht geschlossen
- Headless-Modus deaktivieren zum Debuggen
- Cookie-Button-ID auf Änderungen prüfen
- Timeouts erhöhen

### Keine Bibliotheken gefunden
- Website-Struktur könnte sich geändert haben
- Selektoren auf Updates prüfen
- Internetverbindung verifizieren

## Extension-Probleme

### Extension lädt nicht
- Developer-Modus aktiviert?
- Fehler in `chrome://extensions/` prüfen
- Extension nach Änderungen neu laden

### Keine Ergebnisse auf Amazon
- Bibliothek im Popup ausgewählt?
- Browser-Konsole auf Fehler prüfen
- Auf Buchproduktseite (`/dp/` oder `/gp/product/`)?

### Verfügbarkeitsstatus wird nicht angezeigt
- Internetverbindung prüfen
- Bibliotheks-URL in Einstellungen validieren
- Content-Script-Fehler in Entwicklertools prüfen

## Allgemeine Tipps

### Performance optimieren
- Stabile Internetverbindung
- Browser-Cache leeren
- Extension nach Updates neu laden

### Beste Ergebnisse erzielen
- Lokale Bibliothek auswählen
- Hauptbuchproduktseiten verwenden
- Bevorzugte Sprache einstellen
