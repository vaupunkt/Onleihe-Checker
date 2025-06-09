# Chrome Erweiterung Berechtigungen Dokumentation

Dieses Dokument erklärt, warum jede Berechtigung in der Onleihe Checker Chrome Erweiterung für die ordnungsgemäße Funktionalität notwendig ist.

## Erforderliche Berechtigungen

### `storage`
**Zweck**: Speicherung von Benutzereinstellungen und Bibliotheksauswahl
**Verwendung**: 
- Speichern der ausgewählten Onleihe-Bibliothek (URL und Name)
- Speichern der Sprachpräferenz (Deutsch/Englisch)
- Beibehalten der Benutzereinstellungen zwischen Browser-Sitzungen

### `activeTab`
**Zweck**: Zugriff auf den aktuell aktiven Amazon.de Tab
**Verwendung**:
- Lesen von Buchinformationen (Titel, Autor, ISBN) von Amazon-Produktseiten
- Einbetten des Onleihe-Verfügbarkeitsstatus-Widgets
- Ändern des Seiteninhalts zur Anzeige von Suchergebnissen

### `tabs`
**Zweck**: Abfragen und Nachrichten an Tabs für Sprachsynchronisation
**Verwendung**:
- Senden von Sprachänderungsbenachrichtigungen an alle Amazon-Tabs, wenn der Benutzer die Sprache im Popup ändert
- Abfragen geöffneter Tabs zur Aktualisierung der Spracheinstellungen über mehrere Amazon-Seiten hinweg
- Erforderlich für Tab-übergreifende Kommunikation

### `scripting`
**Zweck**: Ausführung von Skripten in Webseiten zum Abrufen von Inhalten
**Verwendung**:
- Ausführung von Skripten in Hintergrund-Tabs zum Abrufen von Onleihe-Suchergebnissen
- Extrahieren von HTML-Inhalten von Onleihe-Bibliothekswebsites
- Umgehung von CORS-Beschränkungen beim Abrufen von Bibliotheksdaten

## Host-Berechtigungen

### Amazon-Domains
```
"https://www.amazon.de/*"
"https://amazon.de/*"
```
**Zweck**: Zugriff auf Amazon.de Produktseiten
**Verwendung**:
- Extrahieren von Buchmetadaten (Titel, Autor, ISBN)
- Einbetten des Verfügbarkeitsstatus-Widgets
- Überwachung der Seitennavigation für Single-Page-App-Verhalten

### Allgemeine Onleihe-Domains
```
"https://*.onleihe.de/*"
"https://*.onleihe.net/*"
"https://*.onleihe.ch/*"
"https://*.onleihe.at/*"
"https://*.onleihe.be/*"
"https://*.onleihe.fr/*"
"https://*.onleihe.it/*"
"https://*.onleihe.lu/*"
"https://*.onleihe.li/*"
```
**Zweck**: Zugriff auf internationale Onleihe-Plattformen
**Verwendung**:
- Abrufen von Suchergebnissen von verschiedenen länderspezifischen Onleihe-Instanzen
- Unterstützung von Bibliotheken in deutschsprachigen Ländern und internationalen Standorten

### Spezifische Bibliotheks-Domains
```
"https://www.ostalb-onleihe.de/*"
"https://ostalb.onleihe.de/*"
"https://www.metropolbib.de/*"
"https://www.franken-onleihe.de/*"
"https://www.leo-sued.de/*"
"https://www.leo-nord.de/*"
"https://www.enio24.de/*"
"https://www.digibobb.de/*"
"https://www.biblioload.de/*"
"https://www.biblioplus-digital.de/*"
"https://www.e-medien-franken.de/*"
"https://www.e-ausleihe-franken.de/*"
"https://www.emedienbayern.de/*"
"https://www.ebook.baden.ch/*"
"https://www.elbe-elster-bibnet.de/*"
"https://hessen.onleihe.de/*"
"https://voebb.onleihe.de/*"
"https://oberlausitz.onleihe.de/*"
"https://www.onleihe-oberlausitz.de/*"
```
**Zweck**: Zugriff auf spezifische deutsche Bibliothekssysteme mit benutzerdefinierten Domains
**Verwendung**:
- Unterstützung regionaler Bibliotheksnetzwerke, die benutzerdefinierte Domain-Namen verwenden
- Abrufen von Verfügbarkeitsdaten von spezialisierten Bibliotheksplattformen
- Behandlung von URL-Weiterleitungen und alternativen Domain-Konfigurationen

### HTTP-Fallback
```
"http://*.onleihe.de/*"
"http://*.onleihe.net/*"
```
**Zweck**: Unterstützung älterer Bibliothekssysteme, die möglicherweise noch HTTP verwenden
**Verwendung**:
- Gewährleistung der Kompatibilität mit Legacy-Bibliotheksinstallationen
- Behandlung gemischter HTTPS/HTTP-Konfigurationen
- Bereitstellung eines Fallbacks für Bibliotheken, die noch nicht auf HTTPS migriert sind

## Web-zugängliche Ressourcen

### `libraries.json`
**Zweck**: Bibliotheksdatenbank zugänglich für Content-Skripte
**Verwendung**:
- Bereitstellung von Bibliotheksinformationen für die Popup-Schnittstelle
- Ermöglichung der Bibliothekssuche und -auswahl

### `locales.js`
**Zweck**: Übersetzungssystem für mehrsprachige Unterstützung
**Verwendung**:
- Laden deutscher und englischer Übersetzungen
- Unterstützung dynamischen Sprachwechsels
- Bereitstellung einer lokalisierten Benutzeroberfläche

## Datenschutz-Überlegungen

- **Keine Datensammlung**: Die Erweiterung greift nur lokal auf Daten für die Funktionalität zu
- **Keine externen Server**: Alle Verarbeitung erfolgt lokal im Browser
- **Begrenzter Bereich**: Berechtigungen sind nur auf notwendige Domains beschränkt
- **Benutzerkontrolle**: Benutzer können genau sehen, welche Bibliotheken die Erweiterung kontaktiert
- **Transparenter Betrieb**: Alle Netzwerkanfragen dienen dem Abrufen öffentlicher Bibliotheksdaten

## Sicherheitsmaßnahmen

- **Minimale Berechtigungen**: Fordert nur Berechtigungen an, die absolut notwendig für die Funktionalität sind
- **Spezifische Domains**: Verwendet spezifische Domain-Muster anstelle breiter Wildcards, wo möglich
- **Lokale Verarbeitung**: Buchinfo-Extraktion erfolgt lokal ohne Senden von Daten an externe Server
- **Kein dauerhafter Hintergrund**: Service Worker aktiviert sich nur bei Bedarf

## Betrachtete Berechtigungs-Alternativen

### Warum nicht `<all_urls>`?
- Zu breit und unnötig
- Würde zusätzliche Datenschutzerklärungen erfordern
- Spezifische Domain-Berechtigungen bieten bessere Sicherheit

### Warum nicht nur `activeTab`?
- Benötigt Zugriff auf mehrere Onleihe-Domains für Suchfunktionalität
- Hintergrund-Skript muss von Bibliothekswebsites abrufen
- Tab-übergreifende Sprachsynchronisation erfordert `tabs`-Berechtigung

### Warum `scripting` anstelle nur Content-Skripte?
- Dynamisches Inhaltsabrufen erfordert Skript-Ausführung in Hintergrund-Tabs
- CORS-Umgehungsmechanismus benötigt programmatische Skript-Einbindung
- Flexibler als vordefinierte Content-Skript-Matches
