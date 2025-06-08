// background.js - Service Worker
// Empfängt Nachrichten vom Content-Skript (content.js)
// und führt die Onleihe-Abfrage durch, um CORS-Probleme zu umgehen.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetch_onleihe_results") {
        const onleiheSearchURL = request.url;
        console.log(`[Background Service Worker] Empfangene Anfrage für Onleihe URL: ${onleiheSearchURL}`);

        fetch(onleiheSearchURL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // HTML parsen, um die Anzahl der Ergebnisse zu finden
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                let resultCount = 0;
                let foundDirectCount = false;

                // Versuche, die direkte Trefferanzahl zu finden (z.B. "X Treffer")
                // Dies sind gängige Selektoren für Onleihe-Suchergebnisseiten.
                // Es kann sein, dass Anpassungen für spezifische Bibliotheken nötig sind.
                const totalCountElement = doc.querySelector('.result-count, .search-results-info__count, .media-count');
                if (totalCountElement) {
                    const countText = totalCountElement.textContent.trim();
                    const match = countText.match(/(\d+)\s+Treffer/); // Sucht nach "X Treffer"
                    if (match && match[1]) {
                        resultCount = parseInt(match[1]);
                        foundDirectCount = true;
                        console.log(`[Background Service Worker] Direkte Trefferanzahl gefunden: ${resultCount}`);
                    } else {
                        // Manchmal steht nur die Zahl dort oder "X Ergebnisse"
                        const pureNumberMatch = countText.match(/^(\d+)/);
                        if (pureNumberMatch && pureNumberMatch[1]) {
                            resultCount = parseInt(pureNumberMatch[1]);
                            foundDirectCount = true;
                            console.log(`[Background Service Worker] Direkte Trefferanzahl (nur Zahl) gefunden: ${resultCount}`);
                        }
                    }
                }

                // Fallback: Wenn keine direkte Trefferanzahl gefunden wird, zähle die Medien-Items
                if (!foundDirectCount) {
                    const mediaItems = doc.querySelectorAll('.media-list-view .media-item, .item-list .item');
                    resultCount = mediaItems.length;
                    console.log(`[Background Service Worker] Direkte Trefferanzahl nicht gefunden, zähle Medien-Items: ${resultCount}`);
                }
                
                // Sende die Anzahl der gefundenen Titel zurück an das Content-Skript
                sendResponse({ success: true, count: resultCount, url: onleiheSearchURL });
            })
            .catch(error => {
                console.error("[Background Service Worker] Fehler beim Abruf der Onleihe-Seite:", error);
                sendResponse({ success: false, error: error.message, url: onleiheSearchURL });
            });
        
        return true; // Zeigt an, dass die Antwort asynchron gesendet wird
    }
});
