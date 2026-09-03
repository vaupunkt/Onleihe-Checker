// Integration tests for content.js against a simulated DOM.
//
//   npm test
//
// Rebuilds Amazon and Goodreads pages, provides a stub of the extension APIs
// and checks what the status field ends up showing. No network access: the
// background script's response is stubbed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHARED = join(REPO, 'shared');

const SCRIPTS = ['browser-api.js', 'i18n.js', 'onleihe-api.js', 'content.js'].map((f) =>
    readFileSync(join(SHARED, f), 'utf8')
);

const STUTTGART = {
    name: 'Stadtbibliothek Stuttgart',
    city: 'Stuttgart',
    postalCode: '70173',
    onleiheId: '695b7ecd848f6947e7dbb5f0',
    libraryId: '695b7ece848f6947e7dbb5f1',
    host: 'stuttgart.onleihe.de'
};

function amazonBookPage({ title = 'Der Steppenwolf: Roman', author = 'Hermann Hesse', isBook = true } = {}) {
    return `<!DOCTYPE html><html lang="de"><body>
        ${isBook ? '<div id="nav-subnav" data-category="books-catalog"></div>' : '<div id="nav-subnav" data-category="kitchen"></div>'}
        <span id="productTitle">${title}</span>
        <div id="bylineInfo"><a class="a-link-normal" data-action="contributor-action">${author}</a></div>
        <div id="detailBullets_feature_div"><ul><li><span class="a-list-item">
            <span class="a-text-bold">ISBN-13</span><span>978-3518463284</span>
        </span></li></ul></div>
    </body></html>`;
}

function goodreadsBookPage({ title = 'The Steppenwolf', author = 'Hermann Hesse' } = {}) {
    return `<!DOCTYPE html><html lang="en"><body>
        <h1 data-testid="bookTitle">${title}</h1>
        <span data-testid="name">${author}</span>
        <div data-testid="bookDetails">ISBN 9780140050004</div>
    </body></html>`;
}

/**
 * Loads the extension scripts into a simulated page.
 * @param {Object} options
 * @param {string} options.html - page content
 * @param {string} options.url - page address
 * @param {Object} options.storage - contents of storage.local
 * @param {Function} options.onMessage - response to check_availability
 */
async function run({ html, url, storage = {}, onMessage, keepOpen = false }) {
    const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
    const { window } = dom;

    const sent = [];
    window.chrome = {
        runtime: {
            sendMessage: async (message) => {
                sent.push(message);
                return onMessage ? onMessage(message) : { success: true, totalItems: 0, available: false, items: [] };
            },
            getURL: (path) => `chrome-extension://test/${path}`,
            onMessage: { addListener: (fn) => { window.__onMessage = fn; } }
        },
        storage: { local: { get: async () => ({ ...storage }), set: async () => {} } }
    };

    for (const source of SCRIPTS) {
        window.eval(source);
    }

    // Wait for the status field - content.js works asynchronously.
    for (let i = 0; i < 60; i += 1) {
        const message = window.document.querySelector('#onleihe-status-message');
        if (message?.textContent?.trim() && !message.textContent.includes('Lade Onleihe')) {
            break;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 25));
    }

    const field = window.document.getElementById('onleihe-checker-status');
    const result = {
        window,
        field,
        text: field?.querySelector('#onleihe-status-message')?.textContent || '',
        link: field?.querySelector('a')?.getAttribute('href') || null,
        background: field?.style.backgroundColor || '',
        sent,
        fieldCount: window.document.querySelectorAll('#onleihe-checker-status').length,
        close: () => window.close()
    };

    // content.js watches for SPA navigation via setInterval. If the window stays
    // open its timers keep the event loop alive and node --test never exits -
    // hence closing it here, once everything has been read out.
    if (!keepOpen) {
        window.close();
    }
    return result;
}

const AMAZON_URL = 'https://www.amazon.de/Steppenwolf/dp/3518463284';
const GOODREADS_URL = 'https://www.goodreads.com/book/show/16631.Steppenwolf';

// --------------------------------------------------------------------------

test('an available title is reported as available now', async () => {
    const result = await run({
        html: amazonBookPage(),
        url: AMAZON_URL,
        storage: { selectedLibrary: STUTTGART, selectedLanguage: 'de' },
        onMessage: () => ({
            success: true,
            totalItems: 8,
            available: true,
            items: [{ title: 'Der Steppenwolf', isAvailable: true }]
        })
    });

    assert.match(result.text, /Sofort ausleihbar/);
    assert.match(result.text, /Stadtbibliothek Stuttgart/);
    assert.match(result.text, /8/);
    assert.equal(result.link, 'https://stuttgart.onleihe.de/search?searchTerm=Der%20Steppenwolf%20Hesse');
});

test('search term is the title without subtitle plus the author surname', async () => {
    const result = await run({
        html: amazonBookPage({ title: 'Der Steppenwolf: Roman', author: 'Hermann Hesse' }),
        url: AMAZON_URL,
        storage: { selectedLibrary: STUTTGART }
    });

    const request = result.sent.find((m) => m.action === 'check_availability');
    assert.equal(request.searchTerm, 'Der Steppenwolf Hesse');
    assert.equal(request.onleiheId, STUTTGART.onleiheId);
    assert.equal(request.libraryId, STUTTGART.libraryId);
});

test('a title containing a period is not truncated', async () => {
    const result = await run({
        html: amazonBookPage({ title: 'Dr. Jekyll and Mr. Hyde', author: 'Robert Louis Stevenson' }),
        url: AMAZON_URL,
        storage: { selectedLibrary: STUTTGART }
    });

    const request = result.sent.find((m) => m.action === 'check_availability');
    // The previous version sent off "Dr" here.
    assert.equal(request.searchTerm, 'Dr. Jekyll and Mr. Hyde Stevenson');
});

test('media types are shown broken down', async () => {
    const result = await run({
        html: amazonBookPage(),
        url: AMAZON_URL,
        storage: { selectedLibrary: STUTTGART, selectedLanguage: 'de' },
        onMessage: () => ({
            success: true,
            totalItems: 8,
            available: true,
            items: [],
            mediaTypes: [
                { mediaType: 'E_BOOK', count: 7 },
                { mediaType: 'E_AUDIO', count: 1 }
            ]
        })
    });

    // The old version silently restricted to ebooks via pMediaType=400001.
    assert.match(result.text, /7 E-Book/);
    assert.match(result.text, /1 Hörbuch/);
});

test('a fully lent title is reported as reservable', async () => {
    const result = await run({
        html: amazonBookPage(),
        url: AMAZON_URL,
        storage: { selectedLibrary: STUTTGART, selectedLanguage: 'de' },
        onMessage: () => ({ success: true, totalItems: 3, available: false, items: [] })
    });

    assert.match(result.text, /verliehen/);
    assert.doesNotMatch(result.text, /Sofort ausleihbar/);
});

test('zero hits are not an error', async () => {
    const result = await run({
        html: amazonBookPage(),
        url: AMAZON_URL,
        storage: { selectedLibrary: STUTTGART, selectedLanguage: 'de' },
        onMessage: () => ({ success: true, totalItems: 0, available: false, items: [] })
    });

    assert.match(result.text, /Nicht im Onleihe-Katalog/);
    assert.doesNotMatch(result.text, /fehlgeschlagen/);
    assert.match(result.text, /Direkt im Onleihe-Katalog suchen/);
});

test('an API failure is shown as an error, not as not found', async () => {
    const result = await run({
        html: amazonBookPage(),
        url: AMAZON_URL,
        storage: { selectedLibrary: STUTTGART, selectedLanguage: 'de' },
        onMessage: () => ({ success: false, reason: 'http', detail: '503' })
    });

    assert.match(result.text, /fehlgeschlagen/);
    assert.match(result.text, /503/);
    assert.doesNotMatch(result.text, /Nicht im Onleihe-Katalog/);
});

test('without a selected library a hint appears instead of a query', async () => {
    const result = await run({
        html: amazonBookPage(),
        url: AMAZON_URL,
        storage: { selectedLanguage: 'de' }
    });

    // Asserts against the German UI text - the test pins selectedLanguage to 'de'.
    assert.match(result.text, /Bibliothek/);
    assert.equal(result.sent.filter((m) => m.action === 'check_availability').length, 0);
});

test('library without a host: check runs, but no catalog link', async () => {
    const { host, ...withoutHost } = STUTTGART;
    const result = await run({
        html: amazonBookPage(),
        url: AMAZON_URL,
        storage: { selectedLibrary: withoutHost, selectedLanguage: 'de' },
        onMessage: () => ({ success: true, totalItems: 2, available: true, items: [] })
    });

    assert.match(result.text, /Sofort ausleihbar/);
    assert.equal(result.link, null);
});

test('a non-book product page gets no status field', async () => {
    const result = await run({
        html: amazonBookPage({ isBook: false }),
        url: 'https://www.amazon.de/Pfanne/dp/B00TEST123',
        storage: { selectedLibrary: STUTTGART }
    });

    assert.equal(result.field, null);
    assert.equal(result.sent.length, 0);
});

test('a Goodreads book page works the same way', async () => {
    const result = await run({
        html: goodreadsBookPage(),
        url: GOODREADS_URL,
        storage: { selectedLibrary: STUTTGART, selectedLanguage: 'en' },
        onMessage: () => ({ success: true, totalItems: 1, available: true, items: [] })
    });

    assert.match(result.text, /Available now/);
    const request = result.sent.find((m) => m.action === 'check_availability');
    assert.equal(request.searchTerm, 'The Steppenwolf Hesse');
});

test('the status field is not inserted twice', async () => {
    const result = await run({
        html: amazonBookPage(),
        url: AMAZON_URL,
        storage: { selectedLibrary: STUTTGART },
        onMessage: () => ({ success: true, totalItems: 1, available: true, items: [] })
    });

    assert.equal(result.fieldCount, 1);
});

test('without a stored language the browser language applies', async () => {
    // jsdom reports navigator.language = 'en-US'.
    const result = await run({
        html: amazonBookPage(),
        url: AMAZON_URL,
        storage: { selectedLibrary: STUTTGART },
        onMessage: () => ({ success: true, totalItems: 1, available: true, items: [] })
    });
    assert.match(result.text, /Available now/);
});

test('a language switch re-translates the visible message', async () => {
    const result = await run({
        html: amazonBookPage(),
        url: AMAZON_URL,
        storage: { selectedLibrary: STUTTGART, selectedLanguage: 'de' },
        onMessage: () => ({ success: true, totalItems: 5, available: true, items: [] }),
        keepOpen: true
    });

    assert.match(result.text, /Sofort ausleihbar/);

    // The previous version replayed the already-translated string, so the text
    // stayed unchanged across a switch.
    result.window.__onMessage({ action: 'language_changed', language: 'en' }, {}, () => {});

    const updated = result.window.document.querySelector('#onleihe-status-message').textContent;
    assert.match(updated, /Available now/);
    assert.doesNotMatch(updated, /Sofort ausleihbar/);
    result.close();
});

test('no markup from foreign data in the status field', async () => {
    const evil = { ...STUTTGART, name: '<img src=x onerror=alert(1)>' };
    const result = await run({
        html: amazonBookPage(),
        url: AMAZON_URL,
        storage: { selectedLibrary: evil },
        onMessage: () => ({ success: true, totalItems: 1, available: true, items: [] })
    });

    assert.equal(result.field.querySelectorAll('img').length, 0);
    assert.match(result.text, /<img/); // present as text, not as an element
});
