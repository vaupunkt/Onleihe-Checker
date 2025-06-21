---
layout: default
title: Installation
---

# 🛠 Installation

## 🚀 Option 1: Chrome Web Store (Empfohlen)

**[📥 Direkt aus dem Chrome Web Store installieren](https://chromewebstore.google.com/detail/onleihe-checker/lbdbelkkmbogfjkeklmpfaijgpdnnncn?hl=de)**

### Vorteile der Web Store Installation:
- ✅ **Ein-Klick-Installation** - keine manuelle Konfiguration nötig
- ✅ **Automatische Updates** - neue Features und Bugfixes werden automatisch installiert
- ✅ **Verifizierte Sicherheit** - von Google geprüft und zertifiziert
- ✅ **Einfache Verwaltung** - über Chrome Extension Manager
- ✅ **Sofortige Verfügbarkeit** - funktioniert auf Amazon.de und Goodreads

### So gehts:
1. **Link öffnen**: [Chrome Web Store](https://chromewebstore.google.com/detail/onleihe-checker/lbdbelkkmbogfjkeklmpfaijgpdnnncn?hl=de)
2. **"Zu Chrome hinzufügen"** klicken
3. **Bestätigen** in der Popup-Nachricht
4. **Fertig!** - Extension ist sofort auf Amazon.de und Goodreads einsatzbereit

---

## 🔧 Option 2: Manuelle Installation (Entwickler)

*Nur für Entwickler oder wenn du die neueste Entwicklungsversion testen möchtest.*

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
   - Besuche eine **Amazon.de Buchseite** oder **Goodreads Buchseite**
   - Die Extension zeigt automatisch die Onleihe-Verfügbarkeit an

### Unterstützte Seiten nach Installation
- ✅ Amazon.de - Alle Buchproduktseiten (`/dp/`, `/gp/product/`)
- ✅ Goodreads.com - Alle Buchdetailseiten (`/book/show/`)

## Web Scraper Setup

### Voraussetzungen
- Python 3.7+
- Chrome/Chromium Browser
- ChromeDriver

### Installation

```bash
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
