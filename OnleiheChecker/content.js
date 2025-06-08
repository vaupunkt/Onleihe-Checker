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

// Function to create and inject the Onleihe status field
async function injectOnleiheStatusField() {
    // Check if field already exists to avoid duplicates
    if (document.getElementById('onleihe-checker-status')) {
        return document.getElementById('onleihe-checker-status');
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
            <p id="onleihe-status-message" style="margin: 0; font-size: 14px; color: inherit;">Loading Onleihe information...</p>
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
        return onleiheStatusDiv;
    } catch (e) {
        console.error("Onleihe Checker: Error injecting status field:", e);
        return null;
    }
}

// Function to update the status field
function updateOnleiheStatus(statusDiv, message, type = 'info', onleiheUrl = null) {
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
            msgElement.innerHTML += `<br><a href="${onleiheUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">View in Onleihe catalog</a>`;
        }
    } else if (type === 'not_found') {
        statusDiv.style.backgroundColor = '#ffe6e6';
        statusDiv.style.borderColor = '#ff6666';
        statusDiv.style.color = '#cc0000';
        msgElement.innerHTML = `<strong>${message}</strong>`;
        if (onleiheUrl) {
            msgElement.innerHTML += `<br><a href="${onleiheUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">Search directly in Onleihe catalog</a>`;
        }
    } else if (type === 'error') {
        statusDiv.style.backgroundColor = '#fff0e6';
        statusDiv.style.borderColor = '#ff9933';
        statusDiv.style.color = '#e65c00';
        msgElement.innerHTML = `<strong>${message}</strong>`;
    } else {
        msgElement.innerHTML = message;
    }
}

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
        updateOnleiheStatus(statusField, 'Please select your Onleihe library in the extension popup.', 'warning');
        return;
    }
    
    updateOnleiheStatus(statusField, `Checking availability in "${selectedLibraryName}"...`, 'loading');

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
        updateOnleiheStatus(statusField, 'No book information (title, author or ISBN) found on Amazon.', 'not_found');
        return;
    }

    const onleiheSearchURL = `${selectedLibraryBaseURL}/frontend/search,0-0-0-0-0-0-0-0-0-0-0.html?cmdId=703&sK=1000&pText=${encodeURIComponent(searchTerm)}&pMediaType=400001&Suchen=Suchen`;
    
    try {
        const responseFromBackground = await chrome.runtime.sendMessage({ 
            action: "fetch_onleihe_results", 
            url: onleiheSearchURL 
        });

        if (responseFromBackground && responseFromBackground.success && responseFromBackground.html) {
            const count = parseOnleiheHtmlForCount(responseFromBackground.html);

            if (count > 0) {
                updateOnleiheStatus(statusField, `Found ${count} results in Onleihe catalog "${selectedLibraryName}"!`, 'success', onleiheSearchURL);
            } else {
                updateOnleiheStatus(statusField, `No results found in Onleihe catalog "${selectedLibraryName}".`, 'not_found', onleiheSearchURL);
            }
        } else {
            updateOnleiheStatus(statusField, `Error retrieving Onleihe data: ${responseFromBackground.error || 'Unknown error'}`, 'error');
            console.error(`Onleihe Checker: Error from background service worker: ${responseFromBackground.error}`);
        }
    } catch (error) {
        console.error("Onleihe Checker: Error communicating with service worker:", error);
        updateOnleiheStatus(statusField, `Communication error: ${error.message}`, 'error');
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

// Event listeners for different loading methods
document.addEventListener('DOMContentLoaded', initializeOnleiheChecker);
window.addEventListener('load', initializeOnleiheChecker);

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeOnleiheChecker();
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
