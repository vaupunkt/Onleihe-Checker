# Firefox Onleihe Checker - Fehlerbehebung

## Häufige Firefox-Warnungen (Harmlos)

Diese Warnungen in der Firefox-Konsole sind normal und beeinträchtigen die Funktionalität nicht:

### 1. Layout-Shift und Longtask Warnungen
```
Ignoring unsupported entryTypes: layout-shift.
Ignoring unsupported entryTypes: longtask.
```
**Ursache:** Firefox unterstützt diese Performance-APIs nicht.
**Lösung:** Kann ignoriert werden, betrifft nur Performance-Monitoring.

### 2. Components Object Warnung
```
The Components object is deprecated. It will soon be removed.
```
**Ursache:** Veraltete Firefox-API, die von manchen Webseiten verwendet wird.
**Lösung:** Betrifft nur die Webseite, nicht die Erweiterung.

### 3. InstallTrigger Warnung
```
InstallTrigger is deprecated and will be removed in the future.
```
**Ursache:** Veraltete Firefox-spezifische API.
**Lösung:** Wird von der Erweiterung nicht verwendet.

### 4. XML Parsing Error
```
XML Parsing Error: no root element found
Location: https://www.amazon.de/hz/audible/sampleplayer
```
**Ursache:** Amazon-interne API-Aufrufe.
**Lösung:** Betrifft nicht die Onleihe-Funktionalität.

## Echte Probleme und Lösungen

### Problem: Erweiterung lädt nicht
**Symptome:** Icon erscheint nicht, keine Funktionalität
**Lösungen:**
1. Firefox neustarten
2. Erweiterung neu laden: `about:debugging` → "Neu laden"
3. Manifest.json auf Syntaxfehler prüfen

### Problem: Keine Onleihe-Ergebnisse
**Symptome:** "Bibliothek auswählen" oder "Fehler beim Abrufen"
**Lösungen:**
1. Bibliothek in Popup auswählen und speichern
2. Auf korrekter Amazon-Buchseite? (URL muss `/dp/` oder `/gp/product/` enthalten)
3. Firefox-Konsole auf echte Fehler prüfen

### Problem: Popup öffnet nicht
**Symptome:** Klick auf Icon zeigt kein Popup
**Lösungen:**
1. `popup.html` auf Syntaxfehler prüfen
2. Popup-Blocker deaktivieren
3. Firefox-Erweiterungsberechtigungen prüfen

### Problem: Content Script funktioniert nicht
**Symptome:** Keine Onleihe-Informationen auf Amazon-Seiten
**Lösungen:**
1. Amazon-Seite neu laden
2. Content Script Berechtigungen prüfen
3. Amazon URL-Pattern im Manifest überprüfen

## Debug-Tools

### Firefox-Konsole für Erweiterungen
1. `about:debugging` öffnen
2. "Dieser Firefox" auswählen
3. Bei Onleihe Checker auf "Untersuchen" klicken
4. Konsole-Tab für Background Script Logs

### Webseiten-Konsole
1. `F12` auf Amazon-Seite drücken
2. Konsole-Tab öffnen
3. Nach "Onleihe Checker" Meldungen suchen

### Storage-Inspektion
```javascript
// In Firefox-Konsole ausführen
browser.storage.local.get().then(console.log);
```

## Performance-Optimierung

### Firefox-spezifische Einstellungen
1. `about:config` öffnen
2. Diese Einstellungen für bessere Performance:
   - `dom.webextensions.serviceWorkerTimeout` → 30000
   - `extensions.webextensions.keepStorageOnUninstall` → false

### Speicher-Management
- Erweiterung regelmäßig neu laden bei intensiver Nutzung
- Firefox-Cache leeren: `Strg+Shift+Del`

## Bekannte Einschränkungen

### Firefox vs Chrome Unterschiede
1. **Manifest V2**: Firefox nutzt ältere API-Version
2. **Background Scripts**: Event Pages statt Service Worker
3. **Tab-Handling**: Andere API-Methoden
4. **Storage**: Slightly different behavior

### Amazon-Seiten Kompatibilität
- Funktioniert auf Desktop-Amazon
- Mobile Amazon-Seiten haben andere URL-Struktur
- Goodreads voll unterstützt

## Support und Logs

### Hilfreiche Log-Nachrichten sammeln
1. Firefox-Erweiterungskonsole öffnen
2. Problem reproduzieren
3. Logs kopieren und bei Fehlermeldung anhängen

### Typische erfolgreiche Logs
```
[Background Script] Firefox background script started and message listener registered
[Background Script] Attempting to fetch: https://...onleihe.de/...
[Background Script] Successfully fetched content via iframe
```

### Typische Fehler-Logs
```
[Background Script] Iframe method failed: Timeout: Request took too long
[Background Script] All methods failed
```

## Entwickler-Tipps

### Lokale Entwicklung
```bash
# Firefox-Erweiterung laden
1. about:debugging
2. "Temporäres Add-on laden"
3. manifest.json auswählen

# Änderungen testen
1. Code ändern
2. "Neu laden" in about:debugging
3. Amazon-Seite neu laden
```

### XPI-Package erstellen
```bash
cd OnleiheChecker_firefox/
./package_firefox.sh
```

Dies erstellt eine `onleihe-checker-firefox-1.2.xpi` Datei für die Distribution.

## Weitere Hilfe

Bei anhaltenden Problemen:
1. GitHub Issues erstellen mit:
   - Firefox-Version
   - Fehlermeldungen aus Konsole
   - Verwendete Amazon-URL
   - Ausgewählte Bibliothek

2. Browser-spezifische Details sammeln:
   - `about:support` → System-Info
   - Andere installierte Erweiterungen
   - Antivirus/Firewall-Software
