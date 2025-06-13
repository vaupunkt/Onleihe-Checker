// background.js - Service Worker für Firefox
// Use browser API that works in both Chrome and Firefox
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

function normalizeUrl(url) {
    if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
    }
    
    url = url.replace(/([^:]\/)\/+/g, '$1');
    
    return url;
}

// Direct fetch approach (more reliable for Firefox)
async function fetchOnleiheContent(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        }
        
        const html = await response.text();
        return html;
        
    } catch (error) {
        console.error("Background: Direct fetch failed:", error);
        throw error;
    }
}

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetch_onleihe_results") {
        let onleiheSearchURL = normalizeUrl(request.url);
        
        console.log("[Background Service Worker] Attempting to fetch:", onleiheSearchURL);
        
        // Use direct fetch method
        fetchOnleiheContent(onleiheSearchURL)
            .then(html => {
                console.log("[Background Service Worker] Successfully fetched content");
                sendResponse({ 
                    success: true, 
                    html: html, 
                    url: onleiheSearchURL 
                });
            })
            .catch(error => {
                console.error("Background: Fetch failed:", error);
                sendResponse({ 
                    success: false, 
                    error: `Fetch failed: ${error.message}`, 
                    url: onleiheSearchURL 
                });
            });
        
        return true; // Keep message channel open for async response
    }
});