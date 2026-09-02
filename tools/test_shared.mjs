// Unit-Tests für die reinen Funktionen der Erweiterung.
//
//   node --test tools/
//
// content.js und onleihe-api.js sind IIFEs, die ihre API an `self` hängen.
// Die Tests laden den Quelltext in einen Kontext mit `self` und greifen auf die
// nicht exportierten Hilfsfunktionen über einen kleinen Test-Hook zu.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHARED = join(REPO, 'shared');

function loadInContext(files, extraGlobals = {}) {
    const sandbox = { console, setTimeout, clearTimeout, URL, atob, fetch: async () => {}, ...extraGlobals };
    sandbox.self = sandbox;
    sandbox.window = sandbox;
    sandbox.navigator = { language: 'de-DE' };
    const context = vm.createContext(sandbox);
    for (const file of files) {
        vm.runInContext(readFileSync(join(SHARED, file), 'utf8'), context, { filename: file });
    }
    return sandbox;
}

// --------------------------------------------------------------------------
// i18n
// --------------------------------------------------------------------------

test('t() ersetzt jeden Platzhalter', () => {
    const { OnleiheI18n } = loadInContext(['i18n.js']);
    OnleiheI18n.setLanguage('de');
    const text = OnleiheI18n.t('content.available', 8, 'Stuttgart');
    assert.match(text, /8/);
    assert.match(text, /Stuttgart/);
});

test('t() fällt bei unbekanntem Key auf den Key zurück', () => {
    const { OnleiheI18n } = loadInContext(['i18n.js']);
    assert.equal(OnleiheI18n.t('gibt.es.nicht'), 'gibt.es.nicht');
});

test('setLanguage lehnt nicht unterstützte Sprachen ab', () => {
    const { OnleiheI18n } = loadInContext(['i18n.js']);
    assert.equal(OnleiheI18n.setLanguage('fr'), false);
    assert.equal(OnleiheI18n.getCurrentLanguage(), 'de');
    assert.equal(OnleiheI18n.setLanguage('en'), true);
});

test('jeder deutsche Key existiert auch auf Englisch', () => {
    const source = readFileSync(join(SHARED, 'i18n.js'), 'utf8');
    const [, deBlock, enBlock] = source.match(/de:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*en:\s*\{([\s\S]*?)\n\s*\}\s*\n\s*\};/);
    const keys = (block) => new Set([...block.matchAll(/'([\w.]+)':/g)].map((m) => m[1]));
    const de = keys(deBlock);
    const en = keys(enBlock);
    assert.deepEqual([...de].filter((k) => !en.has(k)), [], 'Keys fehlen in en');
    assert.deepEqual([...en].filter((k) => !de.has(k)), [], 'Keys fehlen in de');
});

// --------------------------------------------------------------------------
// Katalog-Links
// --------------------------------------------------------------------------

test('buildCatalogUrl nutzt den searchTerm-Parameter der SPA', () => {
    const { OnleiheApi } = loadInContext(['onleihe-api.js']);
    const url = OnleiheApi.buildCatalogUrl('stuttgart.onleihe.de', 'Der Steppenwolf Hesse');
    assert.equal(
        url,
        'https://stuttgart.onleihe.de/search?searchTerm=Der%20Steppenwolf%20Hesse'
    );
});

test('buildCatalogUrl liefert ohne Host null', () => {
    const { OnleiheApi } = loadInContext(['onleihe-api.js']);
    assert.equal(OnleiheApi.buildCatalogUrl(null, 'Steppenwolf'), null);
    assert.equal(OnleiheApi.buildCatalogUrl(undefined, 'Steppenwolf'), null);
});

test('buildProductUrl zeigt auf die Detailroute', () => {
    const { OnleiheApi } = loadInContext(['onleihe-api.js']);
    assert.equal(
        OnleiheApi.buildProductUrl('stuttgart.onleihe.de', 'abc123'),
        'https://stuttgart.onleihe.de/search/mediadetail?productId=abc123'
    );
    assert.equal(OnleiheApi.buildProductUrl('stuttgart.onleihe.de', null), null);
});

// --------------------------------------------------------------------------
// Titel- und Autorenaufbereitung
//
// Diese Funktionen liegen im IIFE von content.js. Statt sie zu exportieren,
// wird hier derselbe Algorithmus gegen die Quelldatei geprüft: der Test liest
// die Konstanten aus content.js, damit er mitwandert.
// --------------------------------------------------------------------------

function loadTitleHelpers() {
    const source = readFileSync(join(SHARED, 'content.js'), 'utf8');
    const separators = source.match(/const SUBTITLE_SEPARATORS = (\[[^\]]*\]);/)[1];
    const minLength = source.match(/const MIN_TITLE_LENGTH = (\d+);/)[1];
    const cleanTitle = source.match(/function cleanTitle\(fullTitle\) \{[\s\S]*?\n    \}/)[0];
    const extractLastName = source.match(/function extractLastName\(fullAuthorName\) \{[\s\S]*?\n    \}/)[0];

    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(
        `const SUBTITLE_SEPARATORS = ${separators};
         const MIN_TITLE_LENGTH = ${minLength};
         ${cleanTitle}
         ${extractLastName}
         this.cleanTitle = cleanTitle;
         this.extractLastName = extractLastName;`,
        sandbox
    );
    return sandbox;
}

test('cleanTitle schneidet einen Untertitel nach Doppelpunkt ab', () => {
    const { cleanTitle } = loadTitleHelpers();
    assert.equal(cleanTitle('Der Steppenwolf: Roman'), 'Der Steppenwolf');
});

test('cleanTitle verkürzt "Dr. Jekyll and Mr. Hyde" nicht auf "Dr"', () => {
    const { cleanTitle } = loadTitleHelpers();
    // Der frühere Code trennte an jedem '.', ' - ' und '.' und lieferte "Dr".
    assert.equal(cleanTitle('Dr. Jekyll and Mr. Hyde'), 'Dr. Jekyll and Mr. Hyde');
});

test('cleanTitle behält Titel mit Bindestrich', () => {
    const { cleanTitle } = loadTitleHelpers();
    assert.equal(cleanTitle('Berlin - Alexanderplatz'), 'Berlin - Alexanderplatz');
});

test('cleanTitle entfernt Klammerzusätze', () => {
    const { cleanTitle } = loadTitleHelpers();
    assert.equal(cleanTitle('Der Steppenwolf (Taschenbuch)'), 'Der Steppenwolf');
    assert.equal(cleanTitle('Momo [Hörbuch]'), 'Momo');
});

test('cleanTitle schneidet nicht, wenn der Rest zu kurz wäre', () => {
    const { cleanTitle } = loadTitleHelpers();
    // Ein Separator direkt am Anfang darf den Titel nicht auslöschen.
    assert.equal(cleanTitle('It: A Novel'), 'It: A Novel');
});

test('cleanTitle normalisiert Whitespace und liefert null für Leeres', () => {
    const { cleanTitle } = loadTitleHelpers();
    assert.equal(cleanTitle('  Der   Steppenwolf \n'), 'Der Steppenwolf');
    assert.equal(cleanTitle(''), null);
    assert.equal(cleanTitle(null), null);
});

test('extractLastName liefert den letzten Namensteil', () => {
    const { extractLastName } = loadTitleHelpers();
    assert.equal(extractLastName('Hermann Hesse'), 'Hesse');
    assert.equal(extractLastName('J. R. R. Tolkien'), 'Tolkien');
    assert.equal(extractLastName('  Cornelia   Funke  '), 'Funke');
    assert.equal(extractLastName(''), null);
    assert.equal(extractLastName(null), null);
});

// --------------------------------------------------------------------------
// libraries.json
// --------------------------------------------------------------------------

test('libraries.json hat die von der API erwartete Form', () => {
    const libraries = JSON.parse(readFileSync(join(SHARED, 'libraries.json'), 'utf8'));

    assert.ok(libraries.length > 2000, `nur ${libraries.length} Einträge`);
    for (const library of libraries) {
        assert.ok(library.name, 'Eintrag ohne Namen');
        assert.match(library.onleiheId, /^[0-9a-f]{24}$/, `onleiheId ungültig bei ${library.name}`);
        assert.match(library.libraryId, /^[0-9a-f]{24}$/, `libraryId ungültig bei ${library.name}`);
        if (library.host) {
            assert.doesNotMatch(library.host, /\//, 'host darf keinen Pfad enthalten');
        }
    }
});

test('libraries.json enthält keine exakten Duplikate', () => {
    const libraries = JSON.parse(readFileSync(join(SHARED, 'libraries.json'), 'utf8'));
    const seen = new Set();
    const duplicates = [];
    for (const library of libraries) {
        const key = `${library.name}|${library.onleiheId}|${library.libraryId}`;
        if (seen.has(key)) {
            duplicates.push(key);
        }
        seen.add(key);
    }
    assert.deepEqual(duplicates, []);
});

test('libraries.json enthält keine internen Test-Mandanten', () => {
    const libraries = JSON.parse(readFileSync(join(SHARED, 'libraries.json'), 'utf8'));
    const suspects = libraries.filter((l) => /^(divibib|test)\b/i.test(l.name) || /^divibib/i.test(l.city || ''));
    assert.deepEqual(suspects.map((l) => l.name), []);
});
