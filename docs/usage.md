---
layout: default
title: Verwendung
---

# 🎯 Verwendung

## Chrome Extension

![OnleiheChecker - PopUp Window](/assets/174_1x_shots_so.png)

### Bibliothek einrichten
1. **Extension-Icon klicken** in der Chrome Toolbar
2. **Sprache wählen** (Deutsch/English)
3. **Bibliothek suchen** in der Dropdown-Liste
4. **"Bibliothek speichern"** klicken

### Verfügbarkeit prüfen

Die Extension funktioniert automatisch auf **Amazon.de** und **Goodreads** Buchseiten:

![Amazon Page Screenshot](/assets/175shots_so.png)

**So funktioniert es:**

#### Amazon.de
1. **Amazon.de Buchseite** öffnen (Product-Seiten mit `/dp/` oder `/gp/product/`)
2. **Automatische Anzeige** der Onleihe-Verfügbarkeit
3. **Direkt zum Katalog** per Link springen

#### Goodreads
1. **Goodreads.com Buchseite** öffnen (Book-Seiten mit `/book/show/`)
2. **Automatische Erkennung** von Titel, Autor und ISBN
3. **Echtzeit-Verfügbarkeitsprüfung** in deiner Bibliothek
4. **Direkter Link** zum Onleihe-Katalog

### Unterstützte Websites
- ✅ **Amazon.de** - Alle Buchproduktseiten
- ✅ **Goodreads.com** - Alle Buchdetailseiten
- ✅ **Automatische Erkennung** - Kein manuelles Umschalten nötig

### Features
- ✅ Automatische Bucherkennung (Titel, Autor, ISBN)
- ✅ Echtzeit-Verfügbarkeitsprüfung
- ✅ Mehrsprachige Oberfläche (Deutsch/English)
- ✅ Persistente Bibliotheksauswahl
- ✅ **Neu**: Vollständige Goodreads-Unterstützung

## Was das Statusfeld sagt

| Anzeige | Bedeutung |
|---|---|
| **Sofort ausleihbar** (grün) | mindestens ein Exemplar ist frei |
| **Alle Exemplare verliehen – vormerkbar** (orange) | im Katalog, aber gerade vergeben |
| **Nicht im Onleihe-Katalog vorhanden** (rot) | der Verbund führt den Titel nicht |
| **Onleihe-Abfrage fehlgeschlagen** | technischer Fehler, Statuscode in der Meldung |

Die letzten beiden sind ausdrücklich zwei verschiedene Dinge: „nicht vorhanden" ist eine Auskunft,
„fehlgeschlagen" ein Fehler.

## Bibliotheksdaten aktualisieren

```bash
npm run libraries
```

Erzeugt `shared/libraries.json` aus der Onleihe-API. Details in den
[technischen Details](technical.md).
