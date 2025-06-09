// content.js
// This script runs on Amazon.de pages.

// ==============================================================================
// Helper functions for DOM manipulation and waiting for elements
// ==============================================================================

/**
 * Waits until a specific DOM element becomes visible on the page.
 * Uses MutationObserver and requestAnimationFrame for robust detection.
 * @param {string} selector - The CSS selector of the element to wait for.
 * @param {number} timeout - Maximum timeout in milliseconds.
 * @returns {Promise<HTMLElement>} A Promise that resolves the element once found.
 */
function waitForElement(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let frameRequest;
        let observer;

        const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
                if (observer) observer.disconnect();
                if (frameRequest) cancelAnimationFrame(frameRequest);
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                if (observer) observer.disconnect();
                if (frameRequest) cancelAnimationFrame(frameRequest);
                reject(new Error(`Timeout: Element '${selector}' not found.`));
            } else {
                frameRequest = requestAnimationFrame(checkElement);
            }
        };

        if (document.body) {
            observer = new MutationObserver(() => {
                checkElement();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        checkElement();
    });
}

// Global flag to track if localization is loaded
let localizationLoaded = false;
let currentStatusField = null; // Store reference to current status field
let currentStatusState = null; // Store current status state for language switching

// Embedded translations to avoid loading issues
const embeddedTranslations = {
    de: {
        'content.loading': 'Lade Onleihe-Informationen...',
        'content.checking': 'Prüfe Verfügbarkeit in "{0}"...',
        'content.please.select.library': 'Bitte wähle deine Onleihe-Bibliothek in der Erweiterung aus.',
        'content.no.book.info': 'Keine Buchinformationen (Titel, Autor oder ISBN) auf Amazon gefunden.',
        'content.found.results': '{0} Ergebnisse im Onleihe-Katalog "{1}" gefunden!',
        'content.no.results': 'Keine Ergebnisse im Onleihe-Katalog "{0}" gefunden.',
        'content.view.catalog': 'Im Onleihe-Katalog anzeigen',
        'content.search.directly': 'Direkt im Onleihe-Katalog suchen',
        'content.error.retrieving': 'Fehler beim Abrufen der Onleihe-Daten: {0}',
        'content.communication.error': 'Kommunikationsfehler: {0}'
    },
    en: {
        'content.loading': 'Loading Onleihe information...',
        'content.checking': 'Checking availability in "{0}"...',
        'content.please.select.library': 'Please select your Onleihe library in the extension popup.',
        'content.no.book.info': 'No book information (title, author or ISBN) found on Amazon.',
        'content.found.results': 'Found {0} results in Onleihe catalog "{1}"!',
        'content.no.results': 'No results found in Onleihe catalog "{0}".',
        'content.view.catalog': 'View in Onleihe catalog',
        'content.search.directly': 'Search directly in Onleihe catalog',
        'content.error.retrieving': 'Error retrieving Onleihe data: {0}',
        'content.communication.error': 'Communication error: {0}'
    }
};

let currentLanguage = 'de'; // Default language

// Embedded translation function
function embeddedT(key, ...args) {
    let text = embeddedTranslations[currentLanguage][key] || embeddedTranslations['en'][key] || key;
    
    // Replace placeholders {0}, {1}, etc. with arguments
    args.forEach((arg, index) => {
        text = text.replace(`{${index}}`, arg);
    });
    
    return text;
}

/**
 * Safe translation function that uses embedded translations as primary and window.t as fallback.
 * @param {string} key - The translation key.
 * @param  {...any} args - Arguments for string interpolation.
 * @returns {string} The translated string or the key itself if not found.
 */
function safeT(key, ...args) {
    // Try embedded translations first
    if (embeddedTranslations[currentLanguage] && embeddedTranslations[currentLanguage][key]) {
        return embeddedT(key, ...args);
    }
    
    // Fallback to window.t if available
    if (typeof window.t === 'function') {
        return window.t(key, ...args);
    }
    
    // Final fallback - try English embedded translations
    if (embeddedTranslations['en'][key]) {
        let text = embeddedTranslations['en'][key];
        args.forEach((arg, index) => {
            text = text.replace(`{${index}}`, arg);
        });
        return text;
    }
    
    // Ultimate fallback - return the key
    return key;
}

// Function to create and inject the Onleihe status field
async function injectOnleiheStatusField() {
    // Check if field already exists to avoid duplicates
    if (document.getElementById('onleihe-checker-status')) {
        currentStatusField = document.getElementById('onleihe-checker-status');
        return currentStatusField;
    }

    let targetElement = null;
    const selectors = [
        '#productTitle',
        '#detailBulletsWrapper_feature_div',
        '#corePriceDisplay_desktop_feature_div',
        '#dp',
        '#dp-container',
        'body'
    ];

    for (const selector of selectors) {
        try {
            targetElement = await waitForElement(selector, 8000);
            if (targetElement) break;
        } catch (error) {
            // Continue to next selector
        }
    }

    if (!targetElement) {
        console.error("Onleihe Checker: No suitable element found for injecting status field.");
        return null;
    }

    const onleiheStatusDiv = document.createElement('div');
    onleiheStatusDiv.id = 'onleihe-checker-status';
    onleiheStatusDiv.className = 'a-section a-spacing-small a-color-secondary';
    onleiheStatusDiv.style.cssText = `
        margin-top: 15px;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 8px;
        background-color: #f7f7f7;
        font-family: 'Inter', sans-serif;
        color: #333;
    `;
    
    onleiheStatusDiv.innerHTML = `
        <div style="display: flex; align-items: center;">
            <div id="onleihe-status-spinner" style="
                border: 4px solid rgba(0, 0, 0, 0.1);
                border-left-color: #2563eb;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
                margin-right: 10px;
                display: none;
            "></div>
            <p id="onleihe-status-message" style="margin: 0; font-size: 14px; color: inherit;">${safeT('content.loading')}</p>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    
    try {
        if (targetElement.id === 'dp-container' || targetElement.id === 'dp' || targetElement.tagName === 'BODY') {
            if (targetElement.querySelector('h1')) { 
                targetElement.querySelector('h1').after(onleiheStatusDiv);
            } else if (targetElement.firstChild) {
                targetElement.insertBefore(onleiheStatusDiv, targetElement.firstChild);
            } else {
                targetElement.appendChild(onleiheStatusDiv);
            }
        } else {
            targetElement.parentNode.insertBefore(onleiheStatusDiv, targetElement.nextSibling);
        }
        currentStatusField = onleiheStatusDiv; // Store reference
        return onleiheStatusDiv;
    } catch (e) {
        console.error("Onleihe Checker: Error injecting status field:", e);
        return null;
    }
}

// Function to update the status field
function updateOnleiheStatus(statusDiv, message, type = 'info', onleiheUrl = null) {
    // Store current state for language switching
    currentStatusState = {
        message: message,
        type: type,
        url: onleiheUrl
    };

    const spinner = statusDiv.querySelector('#onleihe-status-spinner');
    const msgElement = statusDiv.querySelector('#onleihe-status-message');

    spinner.style.display = 'none';
    
    statusDiv.style.backgroundColor = '#f7f7f7';
    statusDiv.style.borderColor = '#ccc';
    statusDiv.style.color = '#333';

    if (type === 'loading') {
        spinner.style.display = 'block';
        msgElement.innerHTML = message;
    } else if (type === 'success') {
        statusDiv.style.backgroundColor = '#e6ffe6';
        statusDiv.style.borderColor = '#66cc66';
        statusDiv.style.color = '#1f8b1f';
        msgElement.innerHTML = `<strong>${message}</strong>`;
        if (onleiheUrl) {
            msgElement.innerHTML += `<br><a href="${onleiheUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">${safeT('content.view.catalog')}</a>`;
        }
    } else if (type === 'not_found') {
        statusDiv.style.backgroundColor = '#ffe6e6';
        statusDiv.style.borderColor = '#ff6666';
        statusDiv.style.color = '#cc0000';
        msgElement.innerHTML = `<strong>${message}</strong>`;
        if (onleiheUrl) {
            msgElement.innerHTML += `<br><a href="${onleiheUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">${safeT('content.search.directly')}</a>`;
        }
    } else if (type === 'error') {
        statusDiv.style.backgroundColor = '#fff0e6';
        statusDiv.style.borderColor = '#ff9933';
        statusDiv.style.color = '#e65c00';
        msgElement.innerHTML = `<strong>${message}</strong>`;
    } else if (type === 'warning') {
        statusDiv.style.backgroundColor = '#fff4e6';
        statusDiv.style.borderColor = '#ff9933';
        statusDiv.style.color = '#b45309';
        msgElement.innerHTML = `<strong>${message}</strong>`;
    } else {
        msgElement.innerHTML = message;
    }
}

// Function to refresh status field with current language
function refreshStatusFieldLanguage() {
    if (currentStatusField && currentStatusState) {
        // Re-render the status with the stored state but updated language
        updateOnleiheStatus(
            currentStatusField, 
            currentStatusState.message, 
            currentStatusState.type, 
            currentStatusState.url
        );
    }
}

// Listen for language change messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "language_changed") {
        currentLanguage = request.language;
        console.log('Onleihe Checker: Language changed to', currentLanguage);
        
        // Also update window language if available
        if (typeof window.setLanguage === 'function') {
            window.setLanguage(request.language);
        }
        
        refreshStatusFieldLanguage();
        sendResponse({ success: true });
    }
});

// ==============================================================================
// Extract book information from Amazon page
// ==============================================================================
function getBookInfoFromAmazon() {
    let isbn = null;
    let title = null;
    let author = null;

    // Extract and clean title
    const titleElement = document.getElementById('productTitle');
    if (titleElement) {
        let fullTitle = titleElement.textContent.trim();
        const separators = [':', '|', '(', '[', '—', ' - ','.'];
        for (const sep of separators) {
            const index = fullTitle.indexOf(sep);
            if (index !== -1) {
                fullTitle = fullTitle.substring(0, index).trim();
            }
        }
        title = fullTitle;
    } else {
        const fallbackTitleElement = document.querySelector('h1 span.a-text-bold, h1 span#ebooksProductTitle');
        if (fallbackTitleElement) {
            let fullTitle = fallbackTitleElement.textContent.trim();
            const separators = [':', '|', '(', '[', '—', ' - ', '.'];
            for (const sep of separators) {
                const index = fullTitle.indexOf(sep);
                if (index !== -1) {
                    fullTitle = fullTitle.substring(0, index).trim();
                }
            }
            title = fullTitle;
        }
    }

    // Extract author (last name only)
    const authorElement = document.querySelector('.author a.a-link-normal, .contributorNameID a.a-link-normal');
    let fullAuthorName = null;

    if (authorElement) {
        fullAuthorName = authorElement.textContent.trim();
    } else {
        const bylineElement = document.getElementById('bylineInfo');
        if (bylineElement) {
            const authorLink = bylineElement.querySelector('a.a-link-normal[data-action="contributor-action"]');
            if (authorLink) {
                fullAuthorName = authorLink.textContent.trim();
            } else {
                const textContent = bylineElement.textContent.trim();
                const match = textContent.match(/(von|By)\s+([A-Za-z\s.]+)/i);
                if (match && match[2]) {
                    fullAuthorName = match[2].trim();
                }
            }
        }
    }

    if (fullAuthorName) {
        const nameParts = fullAuthorName.split(' ');
        if (nameParts.length > 0) {
            author = nameParts[nameParts.length - 1];
        } else {
            author = fullAuthorName;
        }
    }

    // Extract ISBN
    const detailLists = document.querySelectorAll(
        '#detailBullets_feature_div .detail-bullet-list, ' +
        '#productDetails_techSpec_section_1 .detail-bullet-list, ' +
        '#productDetailsTable .a-unordered-list'
    );

    for (const ul of detailLists) {
        const listItems = ul.querySelectorAll('li .a-list-item');
        
        for (const item of listItems) {
            const boldTextSpan = item.querySelector('.a-text-bold');
            const valueSpan = boldTextSpan ? boldTextSpan.nextElementSibling : null;

            if (boldTextSpan && valueSpan) {
                const label = boldTextSpan.textContent.trim();
                const value = valueSpan.textContent.trim();
                const cleanLabel = label.replace(/[\r\n\t:]/g, '').trim();

                if (cleanLabel.includes('ISBN-10')) {
                    isbn = value;
                    break;
                } else if (cleanLabel.includes('ISBN-13')) {
                    if (!isbn) {
                       isbn = value;
                    }
                }
            }
        }
        if (isbn) break;
    }

    return { isbn: isbn, title: title, author: author };
}

/**
 * Parses the HTML response from Onleihe page and counts the results.
 * @param {string} html - The raw HTML string from Onleihe search results page.
 * @returns {number} The number of found results.
 */
function parseOnleiheHtmlForCount(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let resultCount = 0;
    let foundDirectCount = false;

    const possibleSelectors = [
        'h3.headline[test-id="titleRange"]',
        'h3[test-id="titleRange"]',
        '.headline[test-id="titleRange"]',
        '[test-id="titleRange"]',
        '.result-count',
        '.search-results-info__count', 
        '.media-count',
        '.resultCount',
        '.search-result-count',
        '.treffer-anzahl',
        '.ergebnis-anzahl',
        '.titleRange'
    ];

    for (const selector of possibleSelectors) {
        const totalCountElement = doc.querySelector(selector);
        if (totalCountElement) {
            const countText = totalCountElement.textContent.trim();
            
            const patterns = [
                /(\d+)-\d+\s+von\s+(\d+)/i,
                /von\s+(\d+)/i,
                /(\d+)\s+Treffer/i,
                /(\d+)\s+Ergebnisse?/i,
                /(\d+)\s+Titel/i,
                /Treffer:\s*(\d+)/i,
                /^(\d+)$/
            ];
            
            for (const pattern of patterns) {
                const match = countText.match(pattern);
                if (match) {
                    if (pattern.source.includes('von') && match[2]) {
                        resultCount = parseInt(match[2]);
                        foundDirectCount = true;
                        break;
                    } else if (match[1]) {
                        resultCount = parseInt(match[1]);
                        foundDirectCount = true;
                        break;
                    }
                }
            }
            
            if (foundDirectCount) break;
        }
    }

    // Fallback: If no direct result count found, count media items
    if (!foundDirectCount) {
        const itemSelectors = [
            '.media-list-view .media-item',
            '.item-list .item',
            '.result-item',
            '.media-item',
            '.list-item',
            '.search-result'
        ];
        
        for (const selector of itemSelectors) {
            const mediaItems = doc.querySelectorAll(selector);
            if (mediaItems.length > 0) {
                resultCount = mediaItems.length;
                break;
            }
        }
    }
    
    return resultCount;
}

// ==============================================================================
// Main logic executed when Amazon page loads
// ==============================================================================
async function runOnleiheCheck() {
    let statusField;
    try {
        statusField = await injectOnleiheStatusField();
        if (!statusField) {
            console.error("Onleihe Checker: Status field could not be initialized.");
            return;
        }
    } catch (e) {
        console.error("Onleihe Checker: Error during status field injection:", e);
        return;
    }

    const result = await chrome.storage.local.get(['selectedOnleiheLibraryURL', 'selectedOnleiheLibraryName']);
    const selectedLibraryBaseURL = result.selectedOnleiheLibraryURL;
    const selectedLibraryName = result.selectedOnleiheLibraryName;

    if (!selectedLibraryBaseURL) {
        updateOnleiheStatus(statusField, safeT('content.please.select.library'), 'warning');
        return;
    }
    
    updateOnleiheStatus(statusField, safeT('content.checking', selectedLibraryName), 'loading');

    const bookInfo = getBookInfoFromAmazon();
    const amazonIsbn = bookInfo.isbn;
    const amazonTitle = bookInfo.title;
    const amazonAuthor = bookInfo.author;

    let searchTerm = '';
    if (amazonTitle && amazonTitle !== 'Not found') {
        searchTerm = amazonTitle;
        if (amazonAuthor && amazonAuthor !== 'Not found') {
            searchTerm = `${amazonTitle} ${amazonAuthor}`;
        }
    } else if (amazonIsbn && amazonIsbn !== 'Not found') {
        searchTerm = amazonIsbn;
    } else {
        updateOnleiheStatus(statusField, safeT('content.no.book.info'), 'not_found');
        return;
    }

    // Ensure proper URL construction without double slashes
    const baseURL = selectedLibraryBaseURL.endsWith('/') ? selectedLibraryBaseURL.slice(0, -1) : selectedLibraryBaseURL;
    const onleiheSearchURL = `${baseURL}/frontend/search,0-0-0-0-0-0-0-0-0-0-0.html?cmdId=703&sK=1000&pText=${encodeURIComponent(searchTerm)}&pMediaType=400001&Suchen=Suchen`;
    
    try {
        const responseFromBackground = await chrome.runtime.sendMessage({ 
            action: "fetch_onleihe_results", 
            url: onleiheSearchURL 
        });

        if (responseFromBackground && responseFromBackground.success && responseFromBackground.html) {
            const count = parseOnleiheHtmlForCount(responseFromBackground.html);

            if (count > 0) {
                updateOnleiheStatus(statusField, safeT('content.found.results', count, selectedLibraryName), 'success', onleiheSearchURL);
            } else {
                updateOnleiheStatus(statusField, safeT('content.no.results', selectedLibraryName), 'not_found', onleiheSearchURL);
            }
        } else {
            updateOnleiheStatus(statusField, safeT('content.error.retrieving', responseFromBackground.error || 'Unknown error'), 'error');
            console.error(`Onleihe Checker: Error from background service worker: ${responseFromBackground.error}`);
        }
    } catch (error) {
        console.error("Onleihe Checker: Error communicating with service worker:", error);
        updateOnleiheStatus(statusField, safeT('content.communication.error', error.message), 'error');
    }
}

// Initialization function with retry mechanism
async function initializeOnleiheChecker() {
    // Check if we're on an Amazon product page
    if (!window.location.href.includes('/dp/') && !window.location.href.includes('/gp/product/')) {
        return;
    }
    
    // Avoid multiple executions if already active
    if (window.onleiheCheckerInitialized) {
        return;
    }
    window.onleiheCheckerInitialized = true;

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000;
    
    while (retryCount < maxRetries) {
        try {
            await runOnleiheCheck();
            return;
        } catch (error) {
            console.error(`Onleihe Checker: Initialization attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            
            if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }
    
    console.error("Onleihe Checker: All initialization attempts failed.");
}

// Load localization and initialize
async function loadLocalizationAndInit() {
    // Load saved language preference first
    try {
        const result = await chrome.storage.local.get(['selectedLanguage']);
        if (result.selectedLanguage) {
            currentLanguage = result.selectedLanguage;
            console.log('Onleihe Checker: Language preference loaded:', currentLanguage);
        }
    } catch (error) {
        console.warn('Onleihe Checker: Could not load language preference:', error);
    }

    // Try to load external localization in the background (non-blocking)
    const tryLoadExternalLocalization = () => {
        // Check if localization is already loaded
        if (typeof window.t === 'function' && typeof window.OnleiheLocalesLoaded !== 'undefined') {
            console.log('Onleihe Checker: External localization already available');
            if (typeof window.setLanguage === 'function') {
                window.setLanguage(currentLanguage);
            }
            return;
        }
        
        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="locales.js"]');
        if (existingScript) {
            console.log('Onleihe Checker: External locales script already exists');
            return;
        }
        
        // Try to load the locales script (non-blocking)
        console.log('Onleihe Checker: Attempting to load external locales script...');
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('locales.js');
        
        script.onload = () => {
            console.log('Onleihe Checker: External locales script loaded successfully');
            if (typeof window.setLanguage === 'function') {
                window.setLanguage(currentLanguage);
            }
        };
        
        script.onerror = () => {
            console.warn('Onleihe Checker: Could not load external localization script, using embedded translations');
        };
        
        // Add script to document
        if (document.head) {
            document.head.appendChild(script);
        }
    };

    // Start with embedded translations immediately
    console.log('Onleihe Checker: Using embedded translations, starting initialization...');
    
    // Try to load external localization in background
    setTimeout(tryLoadExternalLocalization, 100);
    
    // Initialize immediately with embedded translations
    setTimeout(initializeOnleiheChecker, 200);
}

// Event listeners for different loading methods - ensure single execution
let initializationStarted = false;

function startInitialization() {
    if (initializationStarted) return;
    initializationStarted = true;
    loadLocalizationAndInit();
}

document.addEventListener('DOMContentLoaded', startInitialization);
window.addEventListener('load', startInitialization);

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startInitialization();
}

// Observe URL changes for SPA navigation
let currentUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        window.onleiheCheckerInitialized = false;
        setTimeout(initializeOnleiheChecker, 500);
    }
});

setTimeout(() => {
    if (document.body) {
        urlObserver.observe(document.body, { childList: true, subtree: true });
    }
}, 500);
