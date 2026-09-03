// Unit tests for the extension's pure functions.
//
//   node --test tools/
//
// content.js and onleihe-api.js are IIFEs that attach their API to `self`.
// The tests load the source into a context providing `self` and reach the
// non-exported helpers through a small test hook.

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

test('t() substitutes every placeholder', () => {
    const { OnleiheI18n } = loadInContext(['i18n.js']);
    OnleiheI18n.setLanguage('de');
    const text = OnleiheI18n.t('content.available', 8, 'Stuttgart');
    assert.match(text, /8/);
    assert.match(text, /Stuttgart/);
});

test('t() falls back to the key itself when unknown', () => {
    const { OnleiheI18n } = loadInContext(['i18n.js']);
    assert.equal(OnleiheI18n.t('does.not.exist'), 'does.not.exist');
});

test('setLanguage rejects unsupported languages', () => {
    const { OnleiheI18n } = loadInContext(['i18n.js']);
    assert.equal(OnleiheI18n.setLanguage('fr'), false);
    assert.equal(OnleiheI18n.getCurrentLanguage(), 'de');
    assert.equal(OnleiheI18n.setLanguage('en'), true);
});

test('every German key also exists in English', () => {
    const source = readFileSync(join(SHARED, 'i18n.js'), 'utf8');
    const [, deBlock, enBlock] = source.match(/de:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*en:\s*\{([\s\S]*?)\n\s*\}\s*\n\s*\};/);
    const keys = (block) => new Set([...block.matchAll(/'([\w.]+)':/g)].map((m) => m[1]));
    const de = keys(deBlock);
    const en = keys(enBlock);
    assert.deepEqual([...de].filter((k) => !en.has(k)), [], 'keys missing from en');
    assert.deepEqual([...en].filter((k) => !de.has(k)), [], 'keys missing from de');
});

// --------------------------------------------------------------------------
// Catalog links
// --------------------------------------------------------------------------

test('buildCatalogUrl uses the SPA searchTerm parameter', () => {
    const { OnleiheApi } = loadInContext(['onleihe-api.js']);
    const url = OnleiheApi.buildCatalogUrl('stuttgart.onleihe.de', 'Der Steppenwolf Hesse');
    assert.equal(
        url,
        'https://stuttgart.onleihe.de/search?searchTerm=Der%20Steppenwolf%20Hesse'
    );
});

test('buildCatalogUrl returns null without a host', () => {
    const { OnleiheApi } = loadInContext(['onleihe-api.js']);
    assert.equal(OnleiheApi.buildCatalogUrl(null, 'Steppenwolf'), null);
    assert.equal(OnleiheApi.buildCatalogUrl(undefined, 'Steppenwolf'), null);
});

test('buildProductUrl points at the detail route', () => {
    const { OnleiheApi } = loadInContext(['onleihe-api.js']);
    assert.equal(
        OnleiheApi.buildProductUrl('stuttgart.onleihe.de', 'abc123'),
        'https://stuttgart.onleihe.de/search/mediadetail?productId=abc123'
    );
    assert.equal(OnleiheApi.buildProductUrl('stuttgart.onleihe.de', null), null);
});

// --------------------------------------------------------------------------
// Title and author processing
//
// These functions live inside the IIFE of content.js. Rather than exporting
// them, the same algorithm is checked against the source file: the test reads
// the constants out of content.js so it moves along with the code.
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

test('cleanTitle strips a subtitle after a colon', () => {
    const { cleanTitle } = loadTitleHelpers();
    assert.equal(cleanTitle('Der Steppenwolf: Roman'), 'Der Steppenwolf');
});

test('cleanTitle does not shorten "Dr. Jekyll and Mr. Hyde" to "Dr"', () => {
    const { cleanTitle } = loadTitleHelpers();
    // The previous code split on every '.' and ' - ' and produced "Dr".
    assert.equal(cleanTitle('Dr. Jekyll and Mr. Hyde'), 'Dr. Jekyll and Mr. Hyde');
});

test('cleanTitle keeps titles containing a hyphen', () => {
    const { cleanTitle } = loadTitleHelpers();
    assert.equal(cleanTitle('Berlin - Alexanderplatz'), 'Berlin - Alexanderplatz');
});

test('cleanTitle removes bracketed additions', () => {
    const { cleanTitle } = loadTitleHelpers();
    assert.equal(cleanTitle('Der Steppenwolf (Taschenbuch)'), 'Der Steppenwolf');
    assert.equal(cleanTitle('Momo [Hörbuch]'), 'Momo');
});

test('cleanTitle does not cut when too little would remain', () => {
    const { cleanTitle } = loadTitleHelpers();
    // A separator right at the start must not wipe out the title.
    assert.equal(cleanTitle('It: A Novel'), 'It: A Novel');
});

test('cleanTitle normalises whitespace and returns null for empty input', () => {
    const { cleanTitle } = loadTitleHelpers();
    assert.equal(cleanTitle('  Der   Steppenwolf \n'), 'Der Steppenwolf');
    assert.equal(cleanTitle(''), null);
    assert.equal(cleanTitle(null), null);
});

test('extractLastName returns the last part of the name', () => {
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

test('libraries.json has the shape the API expects', () => {
    const libraries = JSON.parse(readFileSync(join(SHARED, 'libraries.json'), 'utf8'));

    assert.ok(libraries.length > 2000, `only ${libraries.length} entries`);
    for (const library of libraries) {
        assert.ok(library.name, 'entry without a name');
        assert.match(library.onleiheId, /^[0-9a-f]{24}$/, `invalid onleiheId for ${library.name}`);
        assert.match(library.libraryId, /^[0-9a-f]{24}$/, `invalid libraryId for ${library.name}`);
        if (library.host) {
            assert.doesNotMatch(library.host, /\//, 'host must not contain a path');
        }
    }
});

test('libraries.json contains no exact duplicates', () => {
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

test('libraries.json contains no internal test tenants', () => {
    const libraries = JSON.parse(readFileSync(join(SHARED, 'libraries.json'), 'utf8'));
    const suspects = libraries.filter((l) => /^(divibib|test)\b/i.test(l.name) || /^divibib/i.test(l.city || ''));
    assert.deepEqual(suspects.map((l) => l.name), []);
});
