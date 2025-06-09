---
layout: default
title: Technische Details
---

# ⚙️ Technische Details

## Projektstruktur

```
onleihe-scraper/
├── scrape_onleihe.py          # Haupt-Scraping-Skript
├── clean_base_urls.py         # URL-Bereinigung
├── libraries.json             # Bibliotheksdatenbank
├── OnleiheChecker/           # Chrome Extension
│   ├── manifest.json         # Extension-Konfiguration
│   ├── popup.html           # Popup-Interface
│   ├── popup.js             # Popup-Funktionalität
│   ├── content.js           # Amazon-Integration
│   ├── background.js        # Service Worker
│   └── libraries.json       # Bibliotheksdatenbank
└── docs/                    # GitHub Pages
```

## Scraper-Konfiguration

### Debug-Modus aktivieren
```python
# Zeile auskommentieren für sichtbaren Browser
chrome_options.add_argument('--headless')
```

### Timeouts anpassen
```python
# Für langsamere Verbindungen
WebDriverWait(driver, 20)
```

## Extension-Einstellungen

### Local Storage zurücksetzen
1. Rechtsklick auf Extension-Icon → "Inspect popup"
2. Application → Local Storage öffnen
3. `selectedOnleiheLibraryURL` und `selectedOnleiheLibraryName` löschen

### Wartung

```bash
# Bibliotheksdaten aktualisieren
python scrape_onleihe.py && python clean_base_urls.py

# Extension-Datenbank aktualisieren
cp libraries.json OnleiheChecker/
```
