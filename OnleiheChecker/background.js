// background.js - Service Worker
// Receives messages from content script (content.js)
// and performs Onleihe queries to bypass CORS issues.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetch_onleihe_results") {
        const onleiheSearchURL = request.url;

        fetch(onleiheSearchURL, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                sendResponse({ success: true, html: html, url: onleiheSearchURL });
            })
            .catch(error => {
                console.error("[Background Service Worker] Error fetching Onleihe page:", error);
                sendResponse({ success: false, error: error.message, url: onleiheSearchURL });
            });
        
        return true; // Indicates response will be sent asynchronously
    }
});

console.log("[Background Service Worker] Service worker started and message listener registered");
