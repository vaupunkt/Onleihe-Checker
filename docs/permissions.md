---
layout: default
title: Berechtigungen
---

# 🔒 Chrome Extension Berechtigungen

## Erforderliche Berechtigungen

### `storage`
**Zweck**: Speicherung von Benutzereinstellungen
- Ausgewählte Onleihe-Bibliothek (URL und Name)
- Sprachpräferenz (Deutsch/Englisch)
- Einstellungen zwischen Browser-Sitzungen

### `activeTab`
**Zweck**: Zugriff auf aktive Amazon.de Tabs
- Lesen von Buchinformationen (Titel, Autor, ISBN)
- Einbetten des Verfügbarkeitsstatus-Widgets
- Seiteninhalt-Modifikation für Suchergebnisse

### `tabs`
**Zweck**: Tab-übergreifende Sprachsynchronisation
- Sprachänderungsbenachrichtigungen an alle Amazon-Tabs
- Aktualisierung der Spracheinstellungen über mehrere Seiten
- Cross-Tab-Kommunikation

### `scripting`
**Zweck**: Skript-Ausführung für Content-Abruf
- Hintergrund-Tab-Skripte für Onleihe-Suchergebnisse
- HTML-Content-Extraktion von Bibliothekswebsites
- CORS-Beschränkungen umgehen

## Host-Berechtigungen

### Amazon-Domains
- `https://www.amazon.de/*`
- `https://amazon.de/*`

### Onleihe-Domains
- `https://*.onleihe.de/*`
- `https://*.onleihe.net/*`
- Internationale Domains (.ch, .at, .be, etc.)
- Spezifische Bibliotheks-Domains

## Datenschutz

- ✅ **Keine Datensammlung**
- ✅ **Keine externen Server**
- ✅ **Lokale Verarbeitung**
- ✅ **Transparenter Betrieb**

[← Zurück zur Hauptseite](index.html)
