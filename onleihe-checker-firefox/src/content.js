// content.js
// This script runs on Amazon.de pages.

// Use browser API that works in both Chrome and Firefox
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

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

let currentStatusField = null;
let currentStatusState = null;

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

let currentLanguage = 'de';

// Simplified translation function with fallback
function safeT(key, ...args) {
    try {
        if (typeof window.t === 'function') {
            return window.t(key, ...args);
        }
    } catch (e) {
        console.warn('External translation failed, using embedded:', e);
    }
    
    let text = embeddedTranslations[currentLanguage]?.[key] || 
               embeddedTranslations['de']?.[key] || 
               key;
    
    args.forEach((arg, index) => {
        text = text.replace(`{${index}}`, arg);
    });
    
    return text;
}

// ==============================================================================
// Book information extraction and cleaning (like Chrome version)
// ==============================================================================

/**
 * Cleans and shortens book titles by removing subtitles and unwanted text
 * @param {string} title - The raw title from Amazon
 * @returns {string} - The cleaned title
 */
function cleanBookTitle(title) {
    if (!title) return '';
    
    // Remove common subtitle separators and everything after them
    const separators = [
        ': ',  // Most common subtitle separator
        ' - ', // Dash separator
        ' – ', // En dash
        ' — ', // Em dash
        '. ',  // Period separator
        ' | ', // Pipe separator
        ' (',  // Parentheses (series info, etc.)
    ];
    
    let cleanedTitle = title.trim();
    
    // Find the first occurrence of any separator and cut there
    for (const separator of separators) {
        const index = cleanedTitle.indexOf(separator);
        if (index !== -1) {
            cleanedTitle = cleanedTitle.substring(0, index).trim();
            break; // Stop at first found separator
        }
    }
    
    // Remove common unwanted endings if they somehow remain
    const unwantedEndings = [
        ' (German Edition)',
        ' (Kindle Edition)',
        ' (Paperback)',
        ' (Hardcover)',
        ' (eBook)',
        ' Kindle Ausgabe',
        ' Taschenbuch',
        ' Gebundene Ausgabe'
    ];
    
    for (const ending of unwantedEndings) {
        if (cleanedTitle.endsWith(ending)) {
            cleanedTitle = cleanedTitle.substring(0, cleanedTitle.length - ending.length).trim();
        }
    }
    
    return cleanedTitle;
}

/**
 * Cleans author names to get only the main author
 * @param {string} author - The raw author from Amazon
 * @returns {string} - The cleaned author name
 */
function cleanAuthorName(author) {
    if (!author) return '';
    
    // Remove common prefixes and suffixes
    let cleanedAuthor = author.trim();
    
    // Remove "von ", "by ", etc.
    cleanedAuthor = cleanedAuthor.replace(/^(von|by|by\s+)\s+/i, '');
    
    // If there are multiple authors, take only the first one
    // Look for common separators
    const authorSeparators = [' und ', ' and ', ', ', ' & ', ' with '];
    
    for (const separator of authorSeparators) {
        const index = cleanedAuthor.indexOf(separator);
        if (index !== -1) {
            cleanedAuthor = cleanedAuthor.substring(0, index).trim();
            break;
        }
    }
    
    return cleanedAuthor;
}

function getBookInfoFromAmazon() {
    const bookData = {
        title: '',
        author: '',
        isbn: ''
    };

    // Extract title
    const titleSelectors = [
        '#productTitle',
        'h1[data-automation-id="title"]',
        'h1.a-size-large',
        '.product-title h1',
        '#btAsinTitle'
    ];
    
    for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            const rawTitle = element.textContent.trim();
            bookData.title = cleanBookTitle(rawTitle); // Apply title cleaning
            break;
        }
    }

    // Extract author
    const authorSelectors = [
        '.author .a-link-normal',
        '.by-author .a-link-normal',
        '[data-automation-id="author-strip"] .a-link-normal',
        '#bylineInfo .author .a-link-normal',
        '#bylineInfo .a-link-normal'
    ];
    
    for (const selector of authorSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            const rawAuthor = element.textContent.trim();
            bookData.author = cleanAuthorName(rawAuthor); // Apply author cleaning
            break;
        }
    }

    // Extract ISBN
    const bodyText = document.body.innerText;
    const isbnPatterns = [
        /ISBN[-\s]?(?:10|13)?[-\s]?:?\s*(\d{9,13}[\dXx])/gi,
        /(?:ISBN|EAN)[-\s]*:?\s*(\d{10,13})/gi
    ];
    
    for (const pattern of isbnPatterns) {
        const match = pattern.exec(bodyText);
        if (match) {
            bookData.isbn = match[1].replace(/[-\s]/g, '');
            break;
        }
    }

    return bookData;
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
        console.error("Onleihe Checker: No suitable element found for injecting status field");
        return null;
    }

    const statusDiv = document.createElement('div');
    statusDiv.id = 'onleihe-checker-status';
    statusDiv.style.cssText = `
        margin: 15px 0;
        padding: 15px;
        border: 2px solid #ff9900;
        border-radius: 8px;
        background: #fef9e7;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        position: relative;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    `;

    statusDiv.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 20px; margin-right: 8px;">📚</span>
            <strong style="color: #0066c0;">Onleihe Verfügbarkeit</strong>
        </div>
        <div id="onleihe-status-spinner" style="display: none; margin-bottom: 10px;">
            <div style="border: 2px solid #f3f3f3; border-top: 2px solid #ff9900; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block; margin-right: 10px;"></div>
        </div>
        <div id="onleihe-status-message"></div>
    `;

    // Add CSS animation for spinner
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Insert at appropriate position
    if (targetElement.tagName === 'BODY') {
        targetElement.insertBefore(statusDiv, targetElement.firstChild);
    } else {
        targetElement.parentNode.insertBefore(statusDiv, targetElement.nextSibling);
    }

    currentStatusField = statusDiv;
    return statusDiv;
}

// Function to update the status field
function updateOnleiheStatus(statusDiv, message, type = 'info', onleiheUrl = null) {
    currentStatusState = {
        message: message,
        type: type,
        url: onleiheUrl
    };

    const spinner = statusDiv.querySelector('#onleihe-status-spinner');
    const messageElement = statusDiv.querySelector('#onleihe-status-message');

    spinner.style.display = 'none';
    
    statusDiv.style.backgroundColor = '#f7f7f7';
    statusDiv.style.borderColor = '#ccc';
    statusDiv.style.color = '#333';

    if (type === 'loading') {
        spinner.style.display = 'block';
        messageElement.innerHTML = message;
    } else if (type === 'success') {
        statusDiv.style.backgroundColor = '#e6ffe6';
        statusDiv.style.borderColor = '#66cc66';
        statusDiv.style.color = '#1f8b1f';
        messageElement.innerHTML = `<strong>${message}</strong>`;
        if (onleiheUrl) {
            messageElement.innerHTML += `<br><a href="${onleiheUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">${safeT('content.view.catalog')}</a>`;
        }
    } else if (type === 'not_found') {
        statusDiv.style.backgroundColor = '#ffe6e6';
        statusDiv.style.borderColor = '#ff6666';
        statusDiv.style.color = '#cc0000';
        messageElement.innerHTML = `<strong>${message}</strong>`;
        if (onleiheUrl) {
            messageElement.innerHTML += `<br><a href="${onleiheUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">${safeT('content.search.directly')}</a>`;
        }
    } else if (type === 'error') {
        statusDiv.style.backgroundColor = '#fff0e6';
        statusDiv.style.borderColor = '#ff9933';
        statusDiv.style.color = '#e65c00';
        messageElement.innerHTML = `<strong>${message}</strong>`;
    } else if (type === 'warning') {
        statusDiv.style.backgroundColor = '#fff4e6';
        statusDiv.style.borderColor = '#ff9933';
        statusDiv.style.color = '#b45309';
        messageElement.innerHTML = `<strong>${message}</strong>`;
    } else {
        messageElement.innerHTML = message;
    }
}

// Function to parse the Onleihe HTML and extract the number of results
function parseOnleiheHtmlForCount(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const resultCountSelectors = [
        '.pagination .results-count',
        '.results-summary',
        '.result-count',
        '#resultList .result'
    ];
    
    for (const selector of resultCountSelectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
            if (selector === '#resultList .result') {
                return elements.length;
            } else {
                const text = elements[0].textContent;
                const match = text.match(/(\d+)/);
                if (match) {
                    return parseInt(match[1], 10);
                }
            }
        }
    }
    
    // Fallback: count individual result items
    const resultItems = doc.querySelectorAll('.result, .media-item, .title-link');
    return resultItems.length;
}

// ==============================================================================
// Main logic executed when Amazon page loads
// ==============================================================================
async function runOnleiheCheck() {
    let statusField;
    try {
        statusField = await injectOnleiheStatusField();
        if (!statusField) {
            console.error("Onleihe Checker: Status field could not be initialized");
            return;
        }
    } catch (e) {
        console.error("Onleihe Checker: Error during status field injection:", e);
        return;
    }

    const result = await browserAPI.storage.local.get(['selectedOnleiheLibraryURL', 'selectedOnleiheLibraryName']);
    const selectedLibraryBaseURL = result.selectedOnleiheLibraryURL;
    const selectedLibraryName = result.selectedOnleiheLibraryName;

    if (!selectedLibraryBaseURL) {
        updateOnleiheStatus(statusField, safeT('content.please.select.library'), 'warning');
        return;
    }
    
    updateOnleiheStatus(statusField, safeT('content.checking', selectedLibraryName), 'loading');

    const bookInfo = getBookInfoFromAmazon();
    
    console.log('Extracted book info:', bookInfo); // Debug logging
    
    if (!bookInfo.title && !bookInfo.author && !bookInfo.isbn) {
        updateOnleiheStatus(statusField, safeT('content.no.book.info'), 'warning');
        return;
    }

    // Create search term - only title and author like Chrome version
    let searchTerm = '';
    if (bookInfo.title) {
        searchTerm += bookInfo.title;
    }
    if (bookInfo.author) {
        if (searchTerm) searchTerm += ' ';
        searchTerm += bookInfo.author;
    }
    // Note: ISBN is NOT included in search term, matching Chrome behavior
    
    searchTerm = searchTerm.trim();
    console.log('Search term:', searchTerm); // Debug logging
    
    const baseURL = selectedLibraryBaseURL.endsWith('/') ? selectedLibraryBaseURL.slice(0, -1) : selectedLibraryBaseURL;
    const onleiheSearchURL = `${baseURL}/frontend/search,0-0-0-0-0-0-0-0-0-0-0.html?cmdId=703&sK=1000&pText=${encodeURIComponent(searchTerm)}&pMediaType=400001&Suchen=Suchen`;
    
    console.log('Search URL:', onleiheSearchURL); // Debug logging
    
    try {
        const responseFromBackground = await browserAPI.runtime.sendMessage({ 
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
            updateOnleiheStatus(statusField, safeT('content.error.retrieving', responseFromBackground?.error || 'Unknown error'), 'error');
            console.error(`Onleihe Checker: Error from background service worker: ${responseFromBackground?.error}`);
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
    
    console.error("Onleihe Checker: All initialization attempts failed");
}

// Load localization and initialize
async function loadLocalizationAndInit() {
    // Load saved language preference first
    try {
        const result = await browserAPI.storage.local.get(['selectedLanguage']);
        if (result.selectedLanguage) {
            currentLanguage = result.selectedLanguage;
        }
    } catch (error) {
        console.warn('Onleihe Checker: Could not load language preference:', error);
    }

    // Try to load external localization in the background (non-blocking)
    const tryLoadExternalLocalization = () => {
        // Check if localization is already loaded
        if (typeof window.t === 'function' && typeof window.OnleiheLocalesLoaded !== 'undefined') {
            if (typeof window.setLanguage === 'function') {
                window.setLanguage(currentLanguage);
            }
            return;
        }
        
        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="locales.js"]');
        if (existingScript) {
            return;
        }
        
        // Try to load the locales script (non-blocking)
        const script = document.createElement('script');
        script.src = browserAPI.runtime.getURL('src/locales.js');
        
        script.onload = () => {
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