// background.js - Background Script for Firefox
// Receives messages from content script (content.js)
// and performs Onleihe queries to bypass CORS issues.

// ==============================================================================
// Firefox Compatibility Layer
// ==============================================================================

// Use browser API if available (Firefox), fallback to chrome API
const browserAPI = (() => {
    if (typeof browser !== 'undefined') {
        return {
            tabs: browser.tabs,
            runtime: browser.runtime
        };
    } else if (typeof chrome !== 'undefined') {
        return {
            tabs: chrome.tabs,
            runtime: chrome.runtime
        };
    } else {
        throw new Error('No browser extension API available');
    }
})();

// ==============================================================================
// Configuration and Helper Functions
// ==============================================================================

const CONFIG = {
    TIMEOUT: 15000,
    FETCH_OPTIONS: {
        method: 'GET',
        mode: 'no-cors',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    }
};

/**
 * Normalizes URL by ensuring HTTPS and removing duplicate slashes
 */
function normalizeUrl(url) {
    if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
    }
    
    url = url.replace(/([^:]\/)\/+/g, '$1');
    
    return url;
}

/**
 * Creates a standardized success response
 */
function createSuccessResponse(html, url) {
    return { 
        success: true, 
        html: html, 
        data: html, 
        url: url 
    };
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(error, url) {
    return { 
        success: false, 
        error: error, 
        url: url 
    };
}

/**
 * Logs messages with consistent formatting
 */
function log(message, type = 'info') {
    const prefix = "[Background Script]";
    if (type === 'error') {
        console.error(`${prefix} ${message}`);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

/**
 * Checks if the request is a valid Onleihe search request
 */
function isValidOnleiheRequest(request) {
    return request.action === "fetch_onleihe_results" || request.action === "search_onleihe";
}

/**
 * Extracts URL from request (supporting both old and new parameter names)
 */
function extractUrlFromRequest(request) {
    return normalizeUrl(request.url || request.searchUrl);
}

// ==============================================================================
// Tab Management Functions
// ==============================================================================

/**
 * Creates a hidden tab and returns tab ID
 */
function createHiddenTab(url) {
    return new Promise((resolve, reject) => {
        // Validate URL to prevent navigation errors
        try {
            new URL(url);
        } catch (e) {
            reject(new Error(`Invalid URL: ${url}`));
            return;
        }

        browserAPI.tabs.create({
            url: url,
            active: false,
            pinned: false
        }, (tab) => {
            if (browserAPI.runtime.lastError) {
                reject(new Error(browserAPI.runtime.lastError.message));
            } else {
                resolve(tab.id);
            }
        });
    });
}

/**
 * Safely removes a tab
 */
function removeTab(tabId) {
    try {
        browserAPI.tabs.remove(tabId);
    } catch (error) {
        log(`Failed to remove tab ${tabId}: ${error.message}`, 'error');
    }
}

/**
 * Executes script in tab to get page content (Firefox compatible)
 */
function getPageContent(tabId) {
    return new Promise((resolve, reject) => {
        // Use setTimeout to avoid blocking and handle potential timing issues
        setTimeout(() => {
            browserAPI.tabs.executeScript(tabId, {
                code: `
                    try {
                        document.documentElement.outerHTML;
                    } catch (e) {
                        'Error reading page content: ' + e.message;
                    }
                `
            }, (results) => {
                if (browserAPI.runtime.lastError) {
                    reject(new Error(browserAPI.runtime.lastError.message));
                } else if (results && results[0]) {
                    if (results[0].startsWith('Error reading page content:')) {
                        reject(new Error(results[0]));
                    } else {
                        resolve(results[0]);
                    }
                } else {
                    reject(new Error('No content received'));
                }
            });
        }, 100); // Small delay to ensure page is ready
    });
}

/**
 * Sets up tab loading listener with cleanup
 */
function setupTabListener(tabId, resolve, reject, timeout) {
    let resolved = false;
    
    const cleanup = () => {
        if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            removeTab(tabId);
            browserAPI.tabs.onUpdated.removeListener(listener);
        }
    };
    
    const listener = async (tabUpdateId, changeInfo, updatedTab) => {
        if (tabUpdateId === tabId && changeInfo.status === 'complete' && !resolved) {
            cleanup();
            
            try {
                // Add delay to ensure page is fully loaded
                await new Promise(resolve => setTimeout(resolve, 500));
                const html = await getPageContent(tabId);
                resolve(html);
            } catch (error) {
                reject(error);
            }
        }
    };
    
    browserAPI.tabs.onUpdated.addListener(listener);
    return cleanup;
}

/**
 * Fetches content via hidden tab (iframe-like approach)
 */
async function fetchViaIframe(url) {
    return new Promise(async (resolve, reject) => {
        let tabId;
        
        try {
            tabId = await createHiddenTab(url);
        } catch (error) {
            reject(new Error(`Failed to create tab: ${error.message}`));
            return;
        }
        
        // Set up timeout
        const timeout = setTimeout(() => {
            removeTab(tabId);
            reject(new Error('Timeout: Request took too long'));
        }, CONFIG.TIMEOUT);
        
        // Set up listener with cleanup
        setupTabListener(tabId, resolve, reject, timeout);
    });
}

// ==============================================================================
// Fetch Functions
// ==============================================================================

/**
 * Attempts direct fetch as fallback (usually fails due to CORS)
 */
async function fetchDirect(url) {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
    
    try {
        const response = await fetch(url, {
            ...CONFIG.FETCH_OPTIONS,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        }
        
        return await response.text();
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Main fetch function that tries multiple methods
 */
async function fetchOnleiheContent(url) {
    log(`Attempting to fetch: ${url}`);
    
    // Validate URL before attempting fetch
    if (!isValidOnleiheUrl(url)) {
        log(`Invalid Onleihe URL: ${url}`, 'error');
        return createErrorResponse('Invalid Onleihe URL provided', url);
    }
    
    try {
        // Try iframe method first
        const html = await fetchViaIframe(url);
        log("Successfully fetched content via iframe");
        return createSuccessResponse(html, url);
    } catch (iframeError) {
        log(`Iframe method failed: ${iframeError.message}`, 'error');
        
        try {
            // Fallback to direct fetch
            const html = await fetchDirect(url);
            log("Direct fetch succeeded");
            return createSuccessResponse(html, url);
        } catch (fetchError) {
            log("All methods failed", 'error');
            return createErrorResponse(
                `All fetch methods failed. Iframe: ${iframeError.message}. Direct: ${fetchError.message}`,
                url
            );
        }
    }
}

// ==============================================================================
// Message Handler
// ==============================================================================

/**
 * Handles incoming messages from content scripts
 */
async function handleMessage(request, sender, sendResponse) {
    if (!isValidOnleiheRequest(request)) {
        return false; // Not handled
    }
    
    const url = extractUrlFromRequest(request);
    const result = await fetchOnleiheContent(url);
    sendResponse(result);
    
    return true; // Indicates response will be sent asynchronously
}

// ==============================================================================
// Event Listeners and Initialization
// ==============================================================================

// Register message handler with proper async support
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isValidOnleiheRequest(request)) {
        return false; // Not handled
    }
    
    // Handle async operation properly
    handleMessage(request, sender, sendResponse);
    return true; // Indicates response will be sent asynchronously
});

// Background script startup
log("Firefox background script started and message listener registered");

// ==============================================================================
// Firefox-specific Error Handling and Compatibility
// ==============================================================================

// Suppress common Firefox warnings that don't affect functionality
if (typeof window !== 'undefined') {
    // Suppress layout-shift and longtask warnings
    const originalWarn = console.warn;
    console.warn = function(...args) {
        const message = args.join(' ');
        if (message.includes('Ignoring unsupported entryTypes') ||
            message.includes('layout-shift') ||
            message.includes('longtask') ||
            message.includes('Components object is deprecated') ||
            message.includes('InstallTrigger is deprecated')) {
            return; // Suppress these warnings
        }
        originalWarn.apply(console, args);
    };
}

// ==============================================================================
// Enhanced Error Handling for Onleihe Requests
// ==============================================================================

/**
 * Validates if URL is a valid Onleihe domain
 */
function isValidOnleiheUrl(url) {
    try {
        const urlObj = new URL(url);
        const validDomains = [
            'onleihe.de', 'onleihe.net', 'onleihe.ch', 'onleihe.at',
            'onleihe.be', 'onleihe.fr', 'onleihe.it', 'onleihe.lu',
            'onleihe.li', 'ostalb-onleihe.de', 'metropolbib.de',
            'franken-onleihe.de', 'leo-sued.de', 'leo-nord.de',
            'enio24.de', 'digibobb.de', 'biblioload.de'
        ];
        
        return validDomains.some(domain => 
            urlObj.hostname.includes(domain) || urlObj.hostname.endsWith(domain)
        );
    } catch (e) {
        return false;
    }
}
