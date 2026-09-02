// content.js - läuft auf Amazon- und Goodreads-Buchseiten.
//
// Liest Titel und Autor aus der Seite, lässt das Background-Script die
// Verfügbarkeit in der gewählten Onleihe prüfen und blendet das Ergebnis
// oberhalb der Produktdetails ein.

(() => {
    'use strict';

    const { t, setLanguage, detectLanguage } = self.OnleiheI18n;
    const { buildCatalogUrl } = self.OnleiheApi;
    const browserApi = self.OnleiheBrowser;

    const STATUS_FIELD_ID = 'onleihe-checker-status';
    const ELEMENT_TIMEOUT = 8000;
    const URL_POLL_INTERVAL = 1000;
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY = 2000;

    // Nur diese Trennzeichen leiten einen Untertitel ein. Punkt und " - " sind
    // absichtlich nicht dabei: die frühere Fassung schnitt an jedem Separator
    // und machte aus "Dr. Jekyll and Mr. Hyde" den Suchbegriff "Dr".
    const SUBTITLE_SEPARATORS = [':', '|', '(', '[', '—', '–'];
    const MIN_TITLE_LENGTH = 3;

    /** Zustand des Statusfelds als Key + Argumente, damit ein Sprachwechsel neu übersetzen kann. */
    let statusField = null;
    let statusState = null;
    let checkInProgress = false;

    // ==========================================================================
    // DOM-Hilfsfunktionen
    // ==========================================================================

    /**
     * Wartet, bis ein Element im DOM erscheint.
     * @returns {Promise<HTMLElement|null>} null bei Zeitüberschreitung.
     */
    function waitForElement(selector, timeout = ELEMENT_TIMEOUT) {
        const existing = document.querySelector(selector);
        if (existing) {
            return Promise.resolve(existing);
        }
        if (!document.body) {
            return Promise.resolve(null);
        }

        return new Promise((resolve) => {
            let settled = false;
            const finish = (element) => {
                if (settled) {
                    return;
                }
                settled = true;
                observer.disconnect();
                clearTimeout(timer);
                resolve(element);
            };

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    finish(element);
                }
            });
            const timer = setTimeout(() => finish(null), timeout);

            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    // ==========================================================================
    // Seitenerkennung
    // ==========================================================================

    function getCurrentSite() {
        const hostname = window.location.hostname;
        if (hostname.includes('amazon.')) {
            return 'amazon';
        }
        if (hostname.includes('goodreads.')) {
            return 'goodreads';
        }
        return 'unknown';
    }

    /**
     * Prüft, ob die aktuelle Seite eine unterstützte Buchseite ist.
     * Wird pro Durchlauf einmal aufgerufen und durchgegeben.
     */
    function detectSupportedPage() {
        const site = getCurrentSite();
        const url = window.location.href;

        if (site === 'amazon') {
            const isProductPage = url.includes('/dp/') || url.includes('/gp/product/');
            if (!isProductPage) {
                return { site, isValid: false };
            }
            // Amazon liefert Bücher unter derselben /dp/-Struktur wie alles andere;
            // die Kategorie-Navigation unterscheidet sie.
            const booksNav = document.querySelector('#nav-subnav[data-category="books-catalog"]');
            return { site, isValid: Boolean(booksNav) };
        }

        if (site === 'goodreads') {
            return { site, isValid: url.includes('/book/show/') };
        }

        return { site: 'unknown', isValid: false };
    }

    // ==========================================================================
    // Buchdaten auslesen
    // ==========================================================================

    /** Schneidet einen Untertitel ab, lässt den Titel aber unangetastet, wenn zu wenig übrig bliebe. */
    function cleanTitle(fullTitle) {
        if (!fullTitle) {
            return null;
        }
        let title = fullTitle.replace(/\s+/g, ' ').trim();

        for (const separator of SUBTITLE_SEPARATORS) {
            const index = title.indexOf(separator);
            if (index >= MIN_TITLE_LENGTH) {
                title = title.slice(0, index).trim();
            }
        }
        return title || null;
    }

    function extractLastName(fullAuthorName) {
        if (!fullAuthorName) {
            return null;
        }
        const parts = fullAuthorName.replace(/\s+/g, ' ').trim().split(' ');
        return parts.length ? parts[parts.length - 1] : null;
    }

    function firstText(selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element?.textContent?.trim()) {
                return element.textContent.trim();
            }
        }
        return null;
    }

    function getBookInfoFromAmazon() {
        const title = cleanTitle(
            firstText(['#productTitle', 'h1 span#ebooksProductTitle', 'h1 span.a-text-bold'])
        );

        let fullAuthorName = firstText([
            '.author a.a-link-normal',
            '.contributorNameID a.a-link-normal',
            '#bylineInfo a.a-link-normal[data-action="contributor-action"]'
        ]);

        if (!fullAuthorName) {
            const byline = document.getElementById('bylineInfo');
            const match = byline?.textContent?.trim().match(/(?:von|by)\s+([^\n,(]+)/i);
            if (match) {
                fullAuthorName = match[1].trim();
            }
        }

        return { title, author: extractLastName(fullAuthorName) };
    }

    function getBookInfoFromGoodreads() {
        const title = cleanTitle(
            firstText([
                'h1[data-testid="bookTitle"]',
                '.BookPageTitleSection__title h1',
                'h1.gr-h1--serif'
            ])
        );

        const fullAuthorName = firstText([
            'span[data-testid="name"]',
            '.ContributorLink__name',
            '.authorName span',
            'a.authorName'
        ]);

        return { title, author: extractLastName(fullAuthorName) };
    }

    /**
     * ISBN nur bei Bedarf lesen - sie dient allein als Rückfallebene, wenn kein
     * Titel erkennbar ist. Die frühere Fassung extrahierte sie bei jedem
     * Seitenaufruf, obwohl das Ergebnis fast nie verwendet wurde.
     */
    function getIsbnFromPage(site) {
        const pattern = /(\d{13}|\d{10}|\d{9}[Xx])/;

        if (site === 'amazon') {
            const items = document.querySelectorAll(
                '#detailBullets_feature_div li .a-list-item, ' +
                '#productDetails_techSpec_section_1 li .a-list-item, ' +
                '#productDetailsTable li .a-list-item'
            );
            for (const item of items) {
                const label = item.querySelector('.a-text-bold');
                const value = label?.nextElementSibling;
                if (!label || !value) {
                    continue;
                }
                if (/ISBN-1[03]/i.test(label.textContent)) {
                    const match = value.textContent.replace(/[\s-]/g, '').match(pattern);
                    if (match) {
                        return match[1];
                    }
                }
            }
            return null;
        }

        const details = document.querySelector('[data-testid="bookDetails"], .BookDetails, #details');
        const match = details?.textContent?.match(/ISBN[^\d]{0,12}(\d{13}|\d{10}|\d{9}[Xx])/i);
        return match ? match[1] : null;
    }

    function getBookInfo(site) {
        return site === 'amazon' ? getBookInfoFromAmazon() : getBookInfoFromGoodreads();
    }

    /** Baut den Suchbegriff. Mehrere Wörter werden serverseitig UND-verknüpft. */
    function buildSearchTerm(site) {
        const { title, author } = getBookInfo(site);
        if (title) {
            return author ? `${title} ${author}` : title;
        }
        return getIsbnFromPage(site);
    }

    // ==========================================================================
    // Statusfeld
    // ==========================================================================

    function createStatusField() {
        const container = document.createElement('div');
        container.id = STATUS_FIELD_ID;
        container.style.cssText = [
            'margin: 15px 0',
            'padding: 12px',
            'border: 1px solid #d4d4d4',
            'border-radius: 8px',
            'background-color: #f7f7f7',
            'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            'font-size: 14px',
            'line-height: 1.4',
            'color: #333'
        ].join(';');

        const row = document.createElement('div');
        row.style.cssText = 'display: flex; align-items: center; gap: 10px';

        const spinner = document.createElement('div');
        spinner.id = 'onleihe-status-spinner';
        spinner.style.cssText = [
            'border: 3px solid rgba(0, 0, 0, 0.1)',
            'border-left-color: #2563eb',
            'border-radius: 50%',
            'width: 18px',
            'height: 18px',
            'flex: none',
            'animation: onleihe-spin 1s linear infinite',
            'display: none'
        ].join(';');

        const message = document.createElement('p');
        message.id = 'onleihe-status-message';
        message.style.cssText = 'margin: 0; font-size: 14px; color: inherit';

        const style = document.createElement('style');
        style.textContent = '@keyframes onleihe-spin { to { transform: rotate(360deg); } }';

        row.append(spinner, message);
        container.append(row, style);
        return container;
    }

    async function findAmazonAnchor() {
        for (const selector of ['#productTitle', '#detailBulletsWrapper_feature_div', '#dp-container']) {
            const element = await waitForElement(selector);
            if (element) {
                return element;
            }
        }
        return null;
    }

    function findGoodreadsAnchor() {
        return waitForElement(
            '[data-testid="bookDetails"], .BookDetails, .BookPageMetadataSection, .rightContainer, #details'
        );
    }

    async function injectStatusField(site) {
        const existing = document.getElementById(STATUS_FIELD_ID);
        if (existing) {
            statusField = existing;
            return existing;
        }

        const anchor = site === 'amazon' ? await findAmazonAnchor() : await findGoodreadsAnchor();
        if (!anchor) {
            return null;
        }

        const field = createStatusField();
        if (site === 'amazon') {
            anchor.parentNode?.insertBefore(field, anchor.nextSibling);
        } else {
            anchor.insertBefore(field, anchor.firstChild);
        }

        statusField = field;
        return field;
    }

    const STATUS_STYLES = {
        loading: { background: '#f7f7f7', border: '#d4d4d4', color: '#333' },
        available: { background: '#e6ffe6', border: '#66cc66', color: '#1f8b1f' },
        lent: { background: '#fff4e6', border: '#ff9933', color: '#b45309' },
        not_found: { background: '#ffe6e6', border: '#ff6666', color: '#cc0000' },
        error: { background: '#fff0e6', border: '#ff9933', color: '#e65c00' },
        warning: { background: '#fff4e6', border: '#ff9933', color: '#b45309' }
    };

    /**
     * Rendert das Statusfeld.
     * @param {Object} state {type, key, args, linkUrl, linkKey} - der Key wird
     *   gespeichert, nicht der übersetzte Text, damit ein Sprachwechsel wirkt.
     */
    function renderStatus(state) {
        statusState = state;
        if (!statusField) {
            return;
        }

        const style = STATUS_STYLES[state.type] || STATUS_STYLES.loading;
        statusField.style.backgroundColor = style.background;
        statusField.style.borderColor = style.border;
        statusField.style.color = style.color;

        const spinner = statusField.querySelector('#onleihe-status-spinner');
        if (spinner) {
            spinner.style.display = state.type === 'loading' ? 'block' : 'none';
        }

        const message = statusField.querySelector('#onleihe-status-message');
        if (!message) {
            return;
        }

        // Bewusst textContent statt innerHTML: Titel, Bibliotheksname und
        // Fehlertexte sind Fremddaten und dürfen kein Markup einbringen.
        message.textContent = '';
        const text = t(state.key, ...(state.args || []));

        if (state.type === 'loading') {
            message.append(document.createTextNode(text));
        } else {
            const strong = document.createElement('strong');
            strong.textContent = text;
            message.append(strong);
        }

        // Aufschlüsselung nach Medienart: die alte Fassung schränkte die Suche
        // still auf E-Books ein, Hörbücher fielen unter den Tisch.
        if (state.mediaTypes?.length) {
            const summary = state.mediaTypes
                .map((entry) => `${entry.count} ${t(`media.${entry.mediaType}`)}`)
                .join(', ');
            const detail = document.createElement('div');
            detail.textContent = summary;
            detail.style.cssText = 'margin-top: 4px; font-size: 12px; opacity: 0.85';
            message.append(detail);
        }

        if (state.linkUrl) {
            const link = document.createElement('a');
            link.href = state.linkUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = t(state.linkKey);
            link.style.cssText = 'color: #007bff; text-decoration: underline';
            message.append(document.createElement('br'), link);
        }
    }

    // ==========================================================================
    // Ablauf
    // ==========================================================================

    function describeError(response) {
        switch (response?.reason) {
            case 'timeout':
                return t('content.error.timeout');
            case 'http':
                return t('content.error.http', response.detail || '?');
            case 'network':
            case 'auth':
            case 'malformed_response':
                return response.detail || t('content.error.unknown');
            default:
                return response?.detail || t('content.error.unknown');
        }
    }

    async function sendCheckRequest(payload) {
        const response = await browserApi.runtime.sendMessage(payload);
        if (!response) {
            throw new Error(t('content.error.no.response'));
        }
        return response;
    }

    async function runCheck() {
        const page = detectSupportedPage();
        if (!page.isValid || checkInProgress) {
            return;
        }
        checkInProgress = true;

        try {
            const field = await injectStatusField(page.site);
            if (!field) {
                return;
            }

            renderStatus({ type: 'loading', key: 'content.loading' });

            const stored = await browserApi.storage.local.get([
                'selectedLibrary',
                'selectedLanguage'
            ]);
            if (stored.selectedLanguage) {
                setLanguage(stored.selectedLanguage);
            }

            const library = stored.selectedLibrary;
            if (!library?.onleiheId) {
                renderStatus({ type: 'warning', key: 'content.please.select.library' });
                return;
            }

            renderStatus({ type: 'loading', key: 'content.checking', args: [library.name] });

            const searchTerm = buildSearchTerm(page.site);
            if (!searchTerm) {
                renderStatus({ type: 'not_found', key: 'content.no.book.info' });
                return;
            }

            const response = await sendCheckRequest({
                action: 'check_availability',
                onleiheId: library.onleiheId,
                libraryId: library.libraryId,
                searchTerm
            });

            const catalogUrl = buildCatalogUrl(library.host, searchTerm);

            // Fehler und "nichts gefunden" sind zwei verschiedene Ergebnisse.
            if (!response.success) {
                renderStatus({
                    type: 'error',
                    key: 'content.error.retrieving',
                    args: [describeError(response)]
                });
                return;
            }

            if (response.totalItems === 0) {
                renderStatus({
                    type: 'not_found',
                    key: 'content.no.results',
                    args: [library.name],
                    linkUrl: catalogUrl,
                    linkKey: 'content.search.directly'
                });
                return;
            }

            renderStatus({
                type: response.available ? 'available' : 'lent',
                key: response.available ? 'content.available' : 'content.all.lent',
                args: [response.totalItems, library.name],
                mediaTypes: response.mediaTypes,
                linkUrl: catalogUrl,
                linkKey: 'content.view.catalog'
            });
        } finally {
            checkInProgress = false;
        }
    }

    async function runCheckWithRetries() {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
            try {
                await runCheck();
                return;
            } catch (error) {
                if (attempt === MAX_ATTEMPTS) {
                    console.error('Onleihe Checker: Prüfung fehlgeschlagen', error);
                    if (statusField) {
                        renderStatus({
                            type: 'error',
                            key: 'content.error.retrieving',
                            args: [error.message || t('content.error.unknown')]
                        });
                    }
                    return;
                }
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            }
        }
    }

    // ==========================================================================
    // Start und Navigation
    // ==========================================================================

    browserApi.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request?.action === 'language_changed') {
            setLanguage(request.language);
            if (statusState) {
                renderStatus(statusState);
            }
            sendResponse({ success: true });
        }
        return false;
    });

    /**
     * Amazon und Goodreads wechseln Buchseiten teils ohne Reload. Ein
     * Intervall auf location.href reicht dafür - die frühere Fassung hängte
     * einen MutationObserver mit subtree:true an document.body und feuerte
     * damit bei jeder DOM-Änderung der Seite, nur um einen String zu vergleichen.
     */
    function watchForNavigation() {
        let lastUrl = window.location.href;
        const onNavigated = () => {
            if (window.location.href === lastUrl) {
                return;
            }
            lastUrl = window.location.href;
            statusField = null;
            statusState = null;
            runCheckWithRetries();
        };

        window.addEventListener('popstate', onNavigated);
        setInterval(onNavigated, URL_POLL_INTERVAL);
    }

    async function initialize() {
        const stored = await browserApi.storage.local.get(['selectedLanguage']);
        setLanguage(stored.selectedLanguage || detectLanguage());

        await runCheckWithRetries();
        watchForNavigation();
    }

    initialize();
})();
