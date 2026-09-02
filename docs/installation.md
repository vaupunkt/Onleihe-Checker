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
   - Zuerst `npm install && npm run build` ausführen (erzeugt `dist/chrome`)
   - Öffne Chrome und navigiere zu `chrome://extensions/`
   - Aktiviere "Developer mode" (Toggle oben rechts)
   - Klicke "Load unpacked"
   - Wähle den Ordner `dist/chrome` aus

### Schritt-für-Schritt Anleitung für Firefox

1. **Add-on laden**
   - Zuerst `npm install && npm run build` ausführen (erzeugt `dist/firefox`)
   - Bequemer Weg: `npx web-ext run --source-dir dist/firefox`
   - Oder manuell: `about:debugging` → "This Firefox" → "Load Temporary Add-on"
     → `dist/firefox/manifest.json` auswählen

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

## Entwicklung

### Voraussetzungen
- Node.js 20+ (Build und Tests)
- Python 3.9+ (nur zum Aktualisieren der Bibliotheksdaten)

Selenium und ein ChromeDriver sind seit Version 2.0 nicht mehr nötig: die Bibliotheksliste kommt
aus dem Verzeichnis-Endpunkt der Onleihe-API statt aus einer gescrapten Hilfeseite.

### Aufsetzen

```bash
git clone https://github.com/vaupunkt/Onleihe-Checker.git
cd Onleihe-Checker
npm install
npm run build
```

Danach liegen die entpackten Erweiterungen in `dist/chrome` und `dist/firefox`, dazu die
Archive fuer die Stores.

### Zum Testen laden

```bash
# Chrome: chrome://extensions -> Entwicklermodus -> Entpackte Erweiterung laden -> dist/chrome
# Firefox:
npx web-ext run --source-dir dist/firefox
```

Nach Änderungen in `shared/` erneut `npm run build` ausführen – geladen wird `dist/`.

### Bibliotheksdaten aktualisieren

```bash
npm run libraries
```

Mehr dazu in den [technischen Details](technical.md).
