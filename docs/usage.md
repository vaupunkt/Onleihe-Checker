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

## Web Scraper

### Bibliotheksdaten aktualisieren
```bash
python scrape_onleihe.py
```

### URL-Bereinigung
```bash
python clean_base_urls.py
```

### Extension-Datenbank aktualisieren
```bash
cp libraries.json OnleiheChecker/
```
