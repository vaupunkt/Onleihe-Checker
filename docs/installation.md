---
layout: default
title: Installation
---

# 🛠 Installation

## Chrome Extension Setup

### Voraussetzungen
- Chrome/Chromium Browser
- Developer mode aktiviert

### Schritt-für-Schritt Anleitung

1. **Extension laden**
   - Öffne Chrome und navigiere zu `chrome://extensions/`
   - Aktiviere "Developer mode" (Toggle oben rechts)
   - Klicke "Load unpacked"
   - Wähle den `OnleiheChecker` Ordner aus

2. **Bibliothek auswählen**
   - Klicke auf das Extension-Icon in der Chrome Toolbar
   - Suche deine lokale Bibliothek in der Dropdown-Liste
   - Klicke "Bibliothek speichern"

3. **Testen**
   - Besuche eine Amazon.de Buchseite
   - Die Extension zeigt automatisch die Onleihe-Verfügbarkeit an

## Web Scraper Setup

### Voraussetzungen
- Python 3.7+
- Chrome/Chromium Browser
- ChromeDriver

### Installation

```bash
# Repository klonen
cd /Users/vaupunkt/Documents/Programmieren/onleihe-scraper

# Pakete installieren
pip install requests beautifulsoup4 selenium

# ChromeDriver installieren (macOS mit Homebrew)
brew install chromedriver

# Oder manuell herunterladen von https://chromedriver.chromium.org/
```

### Erste Verwendung

```bash
# Bibliotheksdaten sammeln
python scrape_onleihe.py

# URLs bereinigen
python clean_base_urls.py

# Daten zur Extension kopieren
cp libraries.json OnleiheChecker/
```
