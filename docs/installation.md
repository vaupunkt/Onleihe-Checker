---
layout: default
title: Installation
---

# 🛠 Installation

## 🚀 Option 1: Browser Extensions (Empfohlen)

### Chrome Web Store
**[📥 Direkt aus dem Chrome Web Store installieren](https://chromewebstore.google.com/detail/onleihe-checker/lbdbelkkmbogfjkeklmpfaijgpdnnncn?hl=de)**

### Firefox Add-ons
**[🦊 Direkt aus Mozilla Add-ons installieren](https://addons.mozilla.org/en-US/firefox/addon/onleihechecker/)**

### Vorteile der offiziellen Installation:
- ✅ **Ein-Klick-Installation** - keine manuelle Konfiguration nötig
- ✅ **Automatische Updates** - neue Features und Bugfixes werden automatisch installiert
- ✅ **Verifizierte Sicherheit** - von Google und Mozilla geprüft und zertifiziert
- ✅ **Einfache Verwaltung** - über Browser Extension Manager
- ✅ **Sofortige Verfügbarkeit** - funktioniert auf Amazon.de und Goodreads

### So gehts:

#### Für Chrome:
1. **Link öffnen**: [Chrome Web Store](https://chromewebstore.google.com/detail/onleihe-checker/lbdbelkkmbogfjkeklmpfaijgpdnnncn?hl=de)
2. **"Zu Chrome hinzufügen"** klicken
3. **Bestätigen** in der Popup-Nachricht
4. **Fertig!** - Extension ist sofort einsatzbereit

#### Für Firefox:
1. **Link öffnen**: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/onleihechecker/)
2. **"Add to Firefox"** klicken
3. **Bestätigen** in der Popup-Nachricht
4. **Fertig!** - Add-on ist sofort einsatzbereit

---

## 🔧 Option 2: Manuelle Installation (Entwickler)

*Nur für Entwickler oder wenn du die neueste Entwicklungsversion testen möchtest.*

### Voraussetzungen für Chrome
- Chrome/Chromium Browser
- Developer mode aktiviert

### Voraussetzungen für Firefox
- Firefox 60+ Browser
- Developer/Debug-Modus

### Schritt-für-Schritt Anleitung für Chrome

1. **Extension laden**
   - Öffne Chrome und navigiere zu `chrome://extensions/`
   - Aktiviere "Developer mode" (Toggle oben rechts)
   - Klicke "Load unpacked"
   - Wähle den `OnleiheChecker` Ordner aus

### Schritt-für-Schritt Anleitung für Firefox

1. **Add-on laden**
   - Öffne Firefox und navigiere zu `about:debugging`
   - Klicke "This Firefox" → "Load Temporary Add-on"
   - Wähle die `manifest.json` Datei im `OnleiheChecker_firefox` Ordner aus

### Konfiguration (beide Browser)

2. **Bibliothek auswählen**
   - Klicke auf das Extension/Add-on-Icon in der Browser Toolbar
   - Suche deine lokale Bibliothek in der Dropdown-Liste
   - Klicke "Bibliothek speichern"

3. **Testen**
   - Besuche eine **Amazon.de Buchseite** oder **Goodreads Buchseite**
   - Die Extension/das Add-on zeigt automatisch die Onleihe-Verfügbarkeit an

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
