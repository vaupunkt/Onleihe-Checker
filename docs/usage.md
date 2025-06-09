---
layout: default
title: Verwendung
---

# 🎯 Verwendung

## Chrome Extension

![OnleiheChecker - PopUp Window]({{ site.baseurl }}/assets/174_1x_shots_so.png)

### Bibliothek einrichten
1. **Extension-Icon klicken** in der Chrome Toolbar
2. **Sprache wählen** (Deutsch/English)
3. **Bibliothek suchen** in der Dropdown-Liste
4. **"Bibliothek speichern"** klicken

### Verfügbarkeit prüfen
![Amazon Page Screenshot]({{ site.baseurl }}/assets/175shots_so.png)

1. **Amazon.de Buchseite** öffnen
2. **Automatische Anzeige** der Onleihe-Verfügbarkeit
3. **Direkt zum Katalog** per Link springen

### Features
- ✅ Automatische Bucherkennung (Titel, Autor, ISBN)
- ✅ Echtzeit-Verfügbarkeitsprüfung
- ✅ Mehrsprachige Oberfläche
- ✅ Persistente Bibliotheksauswahl

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
