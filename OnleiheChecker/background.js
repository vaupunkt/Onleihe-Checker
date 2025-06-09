// background.js - Service Worker
// Receives messages from content script (content.js)
// and performs Onleihe queries to bypass CORS issues.

function normalizeUrl(url) {
    // Ensure HTTPS protocol
    if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
    }
    
    // Remove double slashes in path
    url = url.replace(/([^:]\/)\/+/g, '$1');
    
    return url;
}

// Function to create a hidden iframe to fetch content
async function fetchViaIframe(url) {
    return new Promise((resolve, reject) => {
        // Create a new tab in the background
        chrome.tabs.create({
            url: url,
            active: false,
            pinned: false
        }, (tab) => {
            const tabId = tab.id;
            let resolved = false;
            
            // Set up a timeout
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    chrome.tabs.remove(tabId);
                    reject(new Error('Timeout: Request took too long'));
                }
            }, 15000);
            
            // Listen for when the tab is loaded
            const listener = (tabUpdateId, changeInfo, updatedTab) => {
                if (tabUpdateId === tabId && changeInfo.status === 'complete' && !resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    
                    // Execute script to get the page content
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        func: () => {
                            return document.documentElement.outerHTML;
                        }
                    }, (results) => {
                        chrome.tabs.remove(tabId);
                        chrome.tabs.onUpdated.removeListener(listener);
                        
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else if (results && results[0]) {
                            resolve(results[0].result);
                        } else {
                            reject(new Error('No content received'));
                        }
                    });
                }
            };
            
            chrome.tabs.onUpdated.addListener(listener);
        });
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetch_onleihe_results") {
        let onleiheSearchURL = normalizeUrl(request.url);
        
        console.log("[Background Service Worker] Attempting to fetch:", onleiheSearchURL);
        
        // Try using iframe method first
        fetchViaIframe(onleiheSearchURL)
            .then(html => {
                console.log("[Background Service Worker] Successfully fetched content via iframe");
                sendResponse({ success: true, html: html, url: onleiheSearchURL });
            })
            .catch(error => {
                console.error("[Background Service Worker] Iframe method failed:", error);
                
                // Fallback to direct fetch (which will likely fail due to CORS)
                fetch(onleiheSearchURL, {
                    method: 'GET',
                    mode: 'no-cors',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(html => {
                    console.log("[Background Service Worker] Direct fetch succeeded");
                    sendResponse({ success: true, html: html, url: onleiheSearchURL });
                })
                .catch(fetchError => {
                    console.error("[Background Service Worker] All methods failed:", fetchError);
                    sendResponse({ 
                        success: false, 
                        error: `All fetch methods failed. Iframe: ${error.message}. Direct: ${fetchError.message}`, 
                        url: onleiheSearchURL 
                    });
                });
            });
        
        return true; // Indicates response will be sent asynchronously
    }
});

console.log("[Background Service Worker] Service worker started and message listener registered");
