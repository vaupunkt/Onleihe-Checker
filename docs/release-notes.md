---
layout: default
title: Release Notes
---

# 📋 Release Notes

---

## Version 2.0.0 – Onleihe 3.0

⚠️ **Pflicht-Update.** Onleihe hat auf „Onleihe 3.0" umgestellt, eine React-Anwendung. Die
Suchseite liefert kein Ergebnis-Markup mehr, aus dem sich die Trefferzahl lesen ließe – Version 1.2
zeigte deshalb bei **jeder** Bibliothek „Keine Ergebnisse gefunden". Version 2.0 spricht die
JSON-API der neuen Web-App an.

### Neu

- **Echte Verfügbarkeit statt Trefferzahl**: „Sofort ausleihbar" oder „verliehen – vormerkbar",
  nicht mehr bloß „8 Ergebnisse gefunden".
- **Österreich, Schweiz und Luxemburg** erstmals dabei. Die alte Liste war rein deutsch, weil der
  Scraper den Abschnitt „Onleihen international" übersprang.
- **2232 Bibliotheken** aus dem offiziellen Verzeichnis-Endpunkt der API statt aus einer
  gescrapten Hilfeseite.
- **Suche nach Ort**: „Stuttgart" findet die Stadtbibliothek. Jeder Eintrag zeigt PLZ und Ort,
  damit gleichnamige Bibliotheken unterscheidbar sind.
- **Hörbücher** werden mitgezählt; vorher schränkte die Abfrage stillschweigend auf E-Books ein.
- Kein Bibliothekskonto nötig – die Abfrage nutzt ein anonymes Gast-Token.

### Behoben

- **Kein aufblitzender Tab mehr.** Die alte Fassung öffnete für jede Prüfung einen echten Tab und
  las dessen HTML aus. Jetzt genügt eine JSON-Anfrage.
- **25 von 66 Bibliotheks-Domains** hatten überhaupt keine Host-Berechtigung; für diese
  Bibliotheken schlug die Prüfung schon vor der Migration fehl.
- **„Dr. Jekyll and Mr. Hyde" wurde zum Suchbegriff „Dr" verkürzt** – die Titelbereinigung schnitt
  an jedem Trennzeichen, auch am Punkt.
- **Firefox**: die gespeicherte Bibliothek wurde beim Öffnen des Popups nie ins Suchfeld
  zurückgeladen und die „gespeichert"-Meldung erschien nie – `browser.*` ist Promise-basiert, die
  Callbacks liefen ins Leere. Statusmeldungen blieben zudem ungestylt.
- **Firefox**: der Hintergrund-Tab wurde gelöscht, *bevor* sein Inhalt gelesen wurde.
- **Sprachwechsel** übersetzt die sichtbare Meldung jetzt wirklich neu; vorher blieb der alte Text
  stehen.
- Fehler und „nichts gefunden" werden unterschieden – vorher sah beides gleich aus.

### Technisch

- **Berechtigungen von 39 auf 4 reduziert**: `storage` plus drei Host-Berechtigungen.
  `activeTab`, `tabs`, `scripting`, `webNavigation` und 35 Bibliotheks-Domains entfallen.
- **Firefox auf Manifest V3**; beide Browser nutzen jetzt dasselbe Manifest-Schema.
- **Eine gemeinsame Quelle** für beide Builds (`shared/`) statt zweier Ordner mit ~830 doppelten
  Codezeilen. `tools/build.sh` baut und packt beide Ziele.
- **Tests und CI**: 31 Unit- und DOM-Tests, dazu ein wöchentlicher Lauf gegen die echte API über
  alle Verbünde. Vorher gab es keine Tests und keine CI – genau deshalb blieb der Ausfall unbemerkt.
- Das Statusfeld wird ohne `innerHTML` aufgebaut; Fremddaten können kein Markup einbringen.

### Hinweis

Die gespeicherte Bibliothek muss **einmal neu gewählt** werden: die Erweiterung adressiert
Bibliotheken jetzt über `onleiheId`/`libraryId` statt über eine Katalog-Adresse.

---

## Version 1.2.0 - Enhanced Release

🎉 **Verbesserte Version mit besserer Performance und Benutzererfahrung!**
[Download v1.2.0](https://github.com/vaupunkt/Onleihe-Checker/releases/download/v1.2/onleiheExtension1.2.zip)

### 🆕 Neue Features in v1.2

#### 🔧 Code-Optimierung
- ✅ **Refactorierte Architektur**: Komplette Code-Umstrukturierung für bessere Lesbarkeit und Wartbarkeit
- ✅ **Reduzierte Duplikation**: Redundanter Code eliminiert und Funktionsorganisation verbessert
- ✅ **Verbesserte Modularität**: Bessere Trennung der Verantwortlichkeiten in allen Komponenten

#### 🎯 Intelligente Seitenerkennung
- ✅ **Präzise Zielerfassung**: Extension aktiviert sich nur auf echten Amazon-Buchseiten
- ✅ **Buchnavigations-Verifikation**: Erkennt Amazons Buchnavigationselement zur Seitenvalidierung
- ✅ **Ressourcen-Optimierung**: Keine unnötige Aktivierung auf Nicht-Buch-Seiten (Elektronik, Kleidung, etc.)

#### 🎨 Visuelle Verbesserungen
- ✅ **Professionelles Icon**: Charakteristisches Thumbnail-Icon für einfache Identifikation im Chrome Extension Manager
- ✅ **Bessere Markenerkennung**: Klare visuelle Identität in Browser-Toolbar und Extension-Liste

---

## Version 1.1.0 - Goodreads Support

🎉 **Großes Update: Goodreads-Unterstützung hinzugefügt!**

### ✨ Neue Features

#### Goodreads.com Integration
- ✅ **Vollständige Goodreads-Unterstützung** - Funktioniert auf allen Buchdetailseiten
- ✅ **Intelligente Bucherkennung** - Titel, Autor und ISBN-Extraktion von Goodreads
- ✅ **Nahtlose Integration** - Gleiches Look & Feel wie auf Amazon.de
- ✅ **Automatische Erkennung** - Kein manuelles Umschalten zwischen Websites nötig

#### Erweiterte Kompatibilität
- ✅ **Multi-Site-Support** - Amazon.de und Goodreads gleichzeitig unterstützt
- ✅ **Verbesserte Selektoren** - Robustere Buchinformations-Extraktion
- ✅ **Site-spezifische Optimierungen** - Angepasst für jede Website-Struktur

### 🛠 Technische Verbesserungen
- ✅ **Erweiterte Manifest-Berechtigungen** für Goodreads-Domains
- ✅ **Site-Detection-Logik** für automatische Website-Erkennung
- ✅ **Unified Status Field System** für konsistente UI auf beiden Websites
- ✅ **Robustere Error-Handling** für verschiedene Seitenstrukturen

### 🌐 Unterstützte Websites
- ✅ **Amazon.de** - Alle Buchproduktseiten (`/dp/`, `/gp/product/`)
- ✅ **Goodreads.com** - Alle Buchdetailseiten (`/book/show/`)
- ✅ **450+ deutsche Bibliotheken** weiterhin unterstützt

---

## Version 1.0.0 - Initial Release

🎉 **Erste stabile Version des Onleihe Checkers!**
[Download v1.0.0](https://github.com/vaupunkt/Onleihe-Checker/releases/download/v1.0/onleiheExtension.zip)

### ✨ Neue Features

#### Amazon.de Integration
- ✅ **Intelligente Seitenerkennung**: Aktiviert sich nur auf echten Amazon.de Buchseiten (verifiziert durch Buchnavigationselement)
- ✅ Automatische Erkennung auf allen Buchproduktseiten
- ✅ Smart Book Recognition (Titel, Autor, ISBN)
- ✅ Echtzeit-Statusanzeige
- ✅ Saubere, unaufdringliche Benutzeroberfläche

#### Bibliotheksunterstützung
- ✅ 450+ deutsche Bibliotheken
- ✅ Regionale Netzwerke (LEO, Franken-Onleihe, etc.)
- ✅ Custom Domains unterstützt
- ✅ Automatische Datenbankupdates

#### Mehrsprachigkeit
- ✅ Deutsche & englische Oberfläche
- ✅ Kontextuelle Übersetzungen

#### Intelligente Suche
- ✅ Multi-Feld-Suche (Titel, Autor, ISBN)
- ✅ Fallback-Strategien
- ✅ Genaue Ergebniszählung

### 🛠 Technische Highlights

#### Performance & Zuverlässigkeit
- ✅ **Optimierte Code-Architektur**: Deutlich refactorierte Codebasis für bessere Wartbarkeit und Performance
- ✅ **Gezielte Aktivierung**: Extension läuft nur auf echten Buchseiten, reduziert unnötige Ressourcennutzung
- ✅ Background Processing
- ✅ CORS-Bypass-Lösung
- ✅ Retry-Logik
- ✅ Speicher-effizient

#### Datenschutz & Sicherheit
- ✅ Lokale Verarbeitung
- ✅ Kein Tracking
- ✅ Minimale Berechtigungen
- ✅ Transparenter Betrieb

#### Browser-Kompatibilität
- ✅ Manifest V3
- ✅ Service Worker
- ✅ Content Security
- ✅ Cross-Tab-Sync

### 📊 Enthaltene Komponenten
- Chrome Extension (Ready-to-install)

### 🌍 Unterstützte Bibliotheken
- **450+ deutsche Bibliotheken**
- Alle großen regionalen Netzwerke
- Strukturierte, validierte Daten
- Geografische Kategorisierung

### 📋 Systemanforderungen
- Chrome Browser 88+
- Internetverbindung für Verfügbarkeitsprüfungen
- Entwicklermodus für Installation

### 🚀 Installation
1. Extension-Dateien herunterladen
2. Developer-Modus in Chrome aktivieren
3. Unpacked Extension laden
4. Bibliothek im Popup auswählen
5. Amazon.de browsen und automatische Anzeige genießen!

---

**Version 1.2.0 Download-Größe**: ~200KB  
**Installationszeit**: < 1 Minute  
**Verbesserungen**: Code-Optimierung, Smart Page Detection, Professionelles Icon

---

**Version 1.0.0 Download-Größe**: ~200KB  
**Installationszeit**: < 1 Minute
