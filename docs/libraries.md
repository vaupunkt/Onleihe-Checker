---
layout: default
title: Unterstützte Bibliotheken
---

# 🌍 Unterstützte Bibliotheken

Die Erweiterung kennt **2232 Bibliotheken**. Sie stammen aus dem offiziellen
Verzeichnis-Endpunkt der Onleihe-API und sind damit vollständig, statt aus einer Hilfeseite
zusammengetragen.

## Abdeckung

| Land | |
|---|---|
| 🇩🇪 Deutschland | alle Onleihe-Bibliotheken und regionalen Verbünde |
| 🇦🇹 Österreich | u. a. Salzburg Land, Vorarlberg, Bezirk Liezen |
| 🇨🇭 Schweiz | u. a. Aargauer Kantonsbibliothek, Bibliothek Oberaargau |
| 🇱🇺 Luxemburg | Onleihe Luxembourg |

Bis Version 1.2 enthielt die Liste ausschließlich deutsche Bibliotheken.
Schweiz und Luxemburg sind seit Version 2.0 dabei.

## Verbünde

Die 2232 Bibliotheken verteilen sich auf rund **120 Verbünde**. Viele Gemeinden teilen sich einen
gemeinsamen Katalog – etwa `metropolbib` oder `libell-e-sued` mit jeweils Dutzenden Mitgliedern.
Die Abfrage erfolgt gegen den Verbund; die Verfügbarkeit gilt für die gewählte Bibliothek.

## Bibliothek finden

Im Popup lässt sich nach **Name und Ort** suchen – „Stuttgart" findet also auch die
Stadtbibliothek. Jeder Eintrag zeigt Postleitzahl und Ort, damit gleichnamige Bibliotheken
unterscheidbar sind: Namen wie „Birkenfeld", „Brühl" oder „Münster" kommen mehrfach vor und
gehören zu verschiedenen Verbünden.

## Daten aktualisieren

```bash
npm run libraries
```

Details in den [technischen Details](technical.md). Die Datei `shared/libraries.json` wird
erzeugt und sollte nicht von Hand bearbeitet werden.
