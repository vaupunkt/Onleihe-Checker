# Onleihe Checker - Firefox Extension

Eine Browser-Erweiterung für Firefox, die die Verfügbarkeit von Büchern in deutschen Onleihe-Bibliotheken überprüft, während Sie auf Amazon.de und Goodreads browsen.

## Features

- ✅ **Amazon.de Integration**: Zeigt automatisch Onleihe-Verfügbarkeit auf Amazon-Buchseiten an
- ✅ **Goodreads Integration**: Unterstützt auch Goodreads-Buchseiten
- ✅ **800+ Bibliotheken**: Unterstützt über 800 deutsche Onleihe-Bibliotheken
- ✅ **Mehrsprachig**: Verfügbar in Deutsch und Englisch
- ✅ **Präzise Erkennung**: Läuft nur auf echten Buchseiten, nicht auf allen Amazon-Seiten
- ✅ **Responsive Design**: Modernes, benutzerfreundliches Interface

## Installation (Firefox)

### Option 1: Aus dem Quellcode
1. Laden Sie den `OnleiheChecker_firefox` Ordner herunter
2. Öffnen Sie Firefox und gehen Sie zu `about:debugging`
3. Klicken Sie auf "Temporäres Add-on laden"
4. Wählen Sie die `manifest.json` Datei im `OnleiheChecker_firefox` Ordner aus

### Option 2: Entwicklermodus
1. Gehen Sie zu `about:addons`
2. Klicken Sie auf das Zahnrad-Symbol und wählen Sie "Add-on aus Datei installieren"
3. Wählen Sie eine .xpi-Datei (falls verfügbar) oder verwenden Sie Option 1

## Verwendung

1. **Bibliothek auswählen**: Klicken Sie auf das Onleihe Checker Symbol in der Firefox-Symbolleiste und wählen Sie Ihre lokale Bibliothek aus
2. **Bücher suchen**: Besuchen Sie Amazon.de oder Goodreads und öffnen Sie eine Buchseite
3. **Verfügbarkeit prüfen**: Die Erweiterung zeigt automatisch an, ob das Buch in Ihrer Onleihe-Bibliothek verfügbar ist

## Firefox-spezifische Änderungen

Diese Firefox-Version unterscheidet sich von der Chrome-Version in folgenden Punkten:

- **Manifest V2**: Verwendet Manifest Version 2 statt V3 für Firefox-Kompatibilität
- **Browser APIs**: Verwendet `browser.*` APIs mit Fallback auf `chrome.*` für Kompatibilität
- **Background Script**: Verwendet `tabs.executeScript` statt der modernen `scripting` API
- **Permissions**: Angepasste Berechtigungen für Firefox

## Technische Details

- **Manifest Version**: 2 (Firefox-kompatibel)
- **Permissions**: storage, activeTab, tabs, verschiedene Onleihe-Domains
- **Content Scripts**: Läuft auf Amazon.de und Goodreads Buchseiten
- **Background Script**: Verarbeitet CORS-geschützte Onleihe-Anfragen

## Unterstützte Browser

- Firefox 60+
- Firefox für Android (experimentell)

## Fehlerbehebung

### Die Erweiterung wird nicht geladen
- Stellen Sie sicher, dass Sie die `manifest.json` aus dem `OnleiheChecker_firefox` Ordner verwenden
- Prüfen Sie die Firefox-Konsole auf Fehlermeldungen

### Keine Onleihe-Ergebnisse
- Überprüfen Sie, ob eine Bibliothek ausgewählt ist
- Stellen Sie sicher, dass Sie sich auf einer Amazon-Buchseite befinden (erkennbar an der URL `/dp/` oder `/gp/product/`)

### Performance-Probleme
- Die Erweiterung läuft nur auf Buchseiten, nicht auf allen Amazon-Seiten
- Bei langsamen Verbindungen kann die Onleihe-Abfrage etwas dauern

## Datenschutz

- Keine Sammlung persönlicher Daten
- Suchanfragen werden direkt an die ausgewählte Onleihe-Bibliothek gesendet
- Lokale Speicherung der Bibliotheksauswahl und Spracheinstellungen

## Entwicklung

Diese Firefox-Version basiert auf dem gleichen Funktionsumfang wie die Chrome-Version, wurde aber für maximale Firefox-Kompatibilität angepasst.

## Version

**Version 1.2 (Firefox)** - Identische Funktionalität zur Chrome-Version mit Firefox-spezifischen Anpassungen

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe die LICENSE-Datei für Details.

## Support

Bei Problemen oder Fragen erstellen Sie bitte ein Issue im GitHub-Repository.
