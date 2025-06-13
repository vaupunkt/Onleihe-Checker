// background.js - Service Worker
// Receives messages from content script (content.js)
// and performs Onleihe queries to bypass CORS issues.

// Use browser API that works in both Chrome and Firefox
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

function normalizeUrl(url) {
    if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
    }
    
    url = url.replace(/([^:]\/)\/+/g, '$1');
    
    return url;
}

// Function to create a hidden iframe to fetch content
async function fetchViaIframe(url) {
    return new Promise((resolve, reject) => {
        // Create a new tab in the background
        browser.tabs.create({
            url: url,
            active: false,
            pinned: false
        }).then((tab) => {
            const tabId = tab.id;
            let resolved = false;
            
            // Set up a timeout
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    browser.tabs.remove(tabId);
                    reject(new Error('Timeout: Request took too long'));
                }
            }, 15000);
            
            // Listen for when the tab is loaded
            const listener = (tabUpdateId, changeInfo) => {
                if (tabUpdateId === tabId && changeInfo.status === 'complete' && !resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    
                    // Execute script to get the page content
                    browser.scripting.executeScript({
                        target: { tabId: tabId },
                        func: () => {
                            return document.documentElement.outerHTML;
                        }
                    }).then((results) => {
                        browser.tabs.remove(tabId);
                        browser.tabs.onUpdated.removeListener(listener);
                        
                        if (browser.runtime.lastError) {
                            reject(new Error(browser.runtime.lastError.message));
                        } else if (results && results[0]) {
                            resolve(results[0].result);
                        } else {
                            reject(new Error('No content received'));
                        }
                    });
                }
            };
            
            browser.tabs.onUpdated.addListener(listener);
        });
    });
}

// Handle messages from content scripts and popup
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkOnleihe') {
        // Make CORS request to Onleihe
        checkOnleiheAvailability(request.data)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ error: error.message }));
        return true; // Keep message channel open for async response
    }
});

async function checkOnleiheAvailability(data) {
  const { libraryUrl, searchTerm, isbn } = data;
  
  try {
    // Construct search URL
    const searchUrl = `${libraryUrl}frontend/search,51-0-0-100-0-0-1-0-0-0-0.html?searchhash=OCLC_d6a2c1f39f9c175c49635ebe1b77fa7512b7b138&searchdata=%7B%22term%22%3A%22${encodeURIComponent(searchTerm)}%22%2C%22facetValues%22%3A%5B%5D%2C%22facetFilters%22%3A%5B%5D%2C%22start%22%3A0%2C%22count%22%3A12%2C%22filter%22%3A%5B%5D%2C%22spell%22%3A%22auto%22%2C%22facetLimit%22%3A30%2C%22facetStart%22%3A0%2C%22timeout%22%3A10000%2C%22explain%22%3Afalse%2C%22extend%22%3Atrue%2C%22expandQuery%22%3Atrue%7D`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse results
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const results = doc.querySelectorAll('.resultlist .result');
    
    return {
      found: results.length > 0,
      count: results.length,
      url: searchUrl
    };
    
  } catch (error) {
    console.error('Onleihe check failed:', error);
    return {
      found: false,
      error: error.message
    };
  }
}