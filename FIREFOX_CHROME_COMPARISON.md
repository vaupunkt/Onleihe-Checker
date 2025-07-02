# Onleihe Checker - Firefox vs Chrome Vergleich

## Funktionalitätsvergleich

| Feature | Chrome Version | Firefox Version | Status |
|---------|---------------|-----------------|---------|
| Amazon.de Integration | ✅ | ✅ | Identisch |
| Goodreads Integration | ✅ | ✅ | Identisch |
| 800+ Bibliotheken | ✅ | ✅ | Identisch |
| Mehrsprachigkeit (DE/EN) | ✅ | ✅ | Identisch |
| Präzise Buchseiten-Erkennung | ✅ | ✅ | Identisch |
| Popup Interface | ✅ | ✅ | Identisch |
| Background Processing | ✅ | ✅ | Identisch |

## Technische Unterschiede

| Aspekt | Chrome Version | Firefox Version |
|--------|---------------|-----------------|
| **Manifest Version** | V3 | V2 |
| **Background Script** | Service Worker | Event Page |
| **API Namespace** | `chrome.*` | `browser.*` mit `chrome.*` Fallback |
| **Script Injection** | `chrome.scripting.executeScript` | `chrome.tabs.executeScript` |
| **Permissions** | Manifest V3 Style | Manifest V2 Style |

## Dateistruktur Vergleich

### Chrome Version (`OnleiheChecker/`)
```
OnleiheChecker/
├── manifest.json (Manifest V3)
├── background.js (Service Worker)
├── content.js (Chrome APIs)
├── popup.html
├── popup.js (Chrome APIs)
├── locales.js
├── libraries.json
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    ├── icon128.png
    └── books.png
```

### Firefox Version (`OnleiheChecker_firefox/`)
```
OnleiheChecker_firefox/
├── manifest.json (Manifest V2)
├── background.js (Event Page, Firefox-kompatibel)
├── content.js (Browser APIs mit Fallback)
├── popup.html (identisch)
├── popup.js (Browser APIs mit Fallback)
├── locales.js (identisch)
├── libraries.json (identisch)
├── README_FIREFOX.md
├── package_firefox.sh
└── icons/ (identisch)
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    ├── icon128.png
    └── books.png
```

## Code-Anpassungen für Firefox

### 1. Manifest.json Änderungen
```json
// Chrome (V3)
{
  "manifest_version": 3,
  "background": {
    "service_worker": "background.js"
  },
  "action": { ... }
}

// Firefox (V2)
{
  "manifest_version": 2,
  "background": {
    "scripts": ["background.js"],
    "persistent": false
  },
  "browser_action": { ... }
}
```

### 2. API-Namespace Anpassungen
```javascript
// Chrome-spezifisch
chrome.storage.local.get(...)
chrome.runtime.sendMessage(...)
chrome.tabs.executeScript(...)

// Firefox-kompatibel mit Fallback
const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;
const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
const tabs = typeof browser !== 'undefined' ? browser.tabs : chrome.tabs;

storage.local.get(...)
runtime.sendMessage(...)
tabs.executeScript(...) // Firefox V2 API
```

### 3. Background Script Unterschiede
```javascript
// Chrome (Service Worker)
chrome.scripting.executeScript({
  target: { tabId: tabId },
  function: () => document.documentElement.outerHTML
});

// Firefox (Event Page)
chrome.tabs.executeScript(tabId, {
  code: 'document.documentElement.outerHTML'
}, (results) => { ... });
```

## Installation und Distribution

### Chrome
- **[📥 Chrome Web Store](https://chromewebstore.google.com/detail/onleihe-checker/lbdbelkkmbogfjkeklmpfaijgpdnnncn?hl=de)** (Empfohlen)
- Developer Mode (unpacked extension)
- .crx package

### Firefox
- **[📥 Firefox Add-ons (AMO)](https://addons.mozilla.org/en-US/firefox/addon/onleihechecker/)** (Empfohlen)
- about:debugging (temporary add-on)
- .xpi package

## Kompatibilität

### Chrome Version
- Chrome 88+
- Chromium-basierte Browser
- Edge 88+

### Firefox Version  
- Firefox 60+
- Firefox ESR
- Firefox für Android (experimentell)

## Entwicklung und Testing

### Chrome
```bash
# Chrome Developer Mode
1. Öffne chrome://extensions/
2. Aktiviere "Entwicklermodus"
3. Klicke "Entpackte Erweiterung laden"
4. Wähle OnleiheChecker/ Ordner
```

### Firefox
```bash
# Firefox Temporary Add-on
1. Öffne about:debugging
2. Klicke "Temporäres Add-on laden"
3. Wähle OnleiheChecker_firefox/manifest.json

# Oder verwende das Paketierungsskript
cd OnleiheChecker_firefox/
./package_firefox.sh
```

## Performance und Verhalten

Beide Versionen bieten:
- ✅ Identische Benutzererfahrung
- ✅ Gleiche Performance
- ✅ Identische Funktionen
- ✅ Synchrone Bibliotheksdaten
- ✅ Gleiche Fehlerbehandlung

## Wartung

Die Firefox-Version wird parallel zur Chrome-Version entwickelt und erhält:
- ✅ Gleichzeitige Updates
- ✅ Identische Bugfixes
- ✅ Neue Features zeitgleich
- ✅ Synchrone Bibliotheksaktualisierungen
