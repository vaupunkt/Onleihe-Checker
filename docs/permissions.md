---
layout: default
title: Berechtigungen
---

# 🔒 Berechtigungen

Seit Version 2.0 fragt die Erweiterung vier Berechtigungen statt vorher 39 ab. Der Grund: sie
spricht nur noch mit **einer** Adresse statt mit jeder einzelnen Bibliotheks-Domain, und sie
braucht keine Skript-Ausführung in fremden Tabs mehr.

## Berechtigungen

### `storage`
Merkt die gewählte Bibliothek und die Sprache lokal im Browser. Verlässt das Gerät nicht.

## Host-Berechtigungen

### `https://api.onleihe.de/*`
Die Verfügbarkeitsabfrage. Eine einzige Adresse – die API-Schnittstelle der Onleihe-Web-App.

### `https://*.amazon.de/*` und `https://*.goodreads.com/*`
Titel und Autor von der Buchseite lesen und das Statusfeld einfügen. Außerdem nötig, um beim
Sprachwechsel offene Buchseiten zu benachrichtigen.

Das Content-Script läuft **nur auf Buchseiten** – `/dp/`, `/gp/product/` und `/book/show/` –,
nicht auf allen Seiten dieser Domains.

## Nicht mehr benötigt

| Weggefallen | Warum |
|---|---|
| `activeTab` | wurde nie genutzt; die Content-Scripts sind fest deklariert |
| `tabs` | die Host-Berechtigungen genügen für die Sprachbenachrichtigung |
| `scripting` | diente dem Auslesen fremder Tabs, das entfällt vollständig |
| `webNavigation` | war im Firefox-Build deklariert, aber nirgends verwendet |
| 35 Bibliotheks-Domains | die Abfrage läuft über `api.onleihe.de` |

Die alte Fassung öffnete für jede Prüfung einen echten Tab mit der Bibliotheksseite und las dessen
HTML aus. Das erforderte Zugriff auf jede Bibliotheks-Domain – und war zugleich unvollständig: 25
der 66 Domains in den Daten fehlten in der Liste, für diese Bibliotheken schlug die Prüfung fehl.

## Datenschutz

- ✅ **Kein Bibliothekskonto, keine Anmeldung** – die Abfrage nutzt ein anonymes Gast-Token
- ✅ **Keine Zugangsdaten** werden verarbeitet oder gespeichert
- ✅ **Keine Analyse, kein Tracking, keine eigenen Server**
- ✅ Einstellungen bleiben lokal

Übertragen wird allein der Suchbegriff – Titel und Autor-Nachname des betrachteten Buches – an
`api.onleihe.de`, weil ohne ihn keine Verfügbarkeitsprüfung möglich ist. Gegenüber Firefox ist dies
als `websiteContent` deklariert.
