---
layout: default
title: Mitarbeit
---

# 🤝 Mitarbeit

## Wie du beitragen kannst

### 🐛 Bug Reports
- Probleme über GitHub Issues melden
- Detaillierte Beschreibung mit Schritten zur Reproduktion
- Browser-Version und Betriebssystem angeben
- Screenshots bei UI-Problemen

### 💡 Feature Requests
- Neue Funktionen über Issues vorschlagen
- Use Case und Nutzen beschreiben
- Mockups oder Designs willkommen

### 📚 Bibliotheksdaten
- Neue Bibliotheken melden
- Fehlerhafte URLs korrigieren
- Internationale Bibliotheken hinzufügen

### 🌍 Übersetzungen
- Neue Sprachen hinzufügen
- Bestehende Übersetzungen verbessern
- `locales.js` erweitern

## Development Setup

### Repository forken
```bash
git clone https://github.com/[dein-username]/onleihe-scraper.git
cd onleihe-scraper
```

### Feature Branch erstellen
```bash
git checkout -b feature/amazing-feature
```

### Änderungen committen
```bash
git commit -m 'Add amazing feature'
```

### Pull Request erstellen
```bash
git push origin feature/amazing-feature
```

## Code Guidelines

### JavaScript (Extension)
- ES6+ verwenden
- Async/await für Promise-Handling
- JSDoc-Kommentare für Funktionen
- Konsistente Einrückung (2 Spaces)

### Python (Scraper)
- PEP 8 Style Guide befolgen
- Type Hints verwenden
- Docstrings für Funktionen
- Error Handling implementieren

### Commit Messages
- Präfix verwenden: `feat:`, `fix:`, `docs:`
- Kurze, beschreibende Nachrichten
- Imperativ verwenden ("Add" nicht "Added")

## Testing

### Extension testen
- Verschiedene Amazon-Buchseiten
- Mehrere Bibliotheken
- Language switching
- Edge Cases (keine ISBN, kein Autor, etc.)

### Scraper testen
- Headless/non-headless Modi
- Verschiedene Netzwerkbedingungen
- Cookie-Banner-Szenarien

[← Zurück zur Hauptseite](index.html)
