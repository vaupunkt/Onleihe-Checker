// background.js - Service Worker.
//
// Nimmt Suchanfragen des Content-Scripts an und stellt sie an api.onleihe.de.
// Der Umweg über das Background-Script ist nötig, weil das Content-Script auf
// amazon.de/goodreads.com läuft und von dort keine Cross-Origin-Anfrage an
// Onleihe stellen darf - hier greift die Host-Permission.
//
// Die frühere Fassung öffnete für jede Prüfung einen echten Tab, wartete auf
// status === 'complete' und las document.documentElement.outerHTML per
// executeScript aus. Das war nur nötig, um HTML zu parsen; mit der JSON-API
// genügt ein fetch. Damit entfallen der sichtbare Tab, der Listener-Leak im
// Timeout-Pfad und die Möglichkeit, beliebige URLs abzurufen.

// Chrome lädt genau eine Service-Worker-Datei, hier muss die API-Schicht
// nachgezogen werden. Firefox MV3 nutzt background.scripts, wo onleihe-api.js
// bereits vor dieser Datei geladen wurde - dort gibt es kein importScripts.
if (!self.OnleiheApi && typeof importScripts === 'function') {
    importScripts('browser-api.js', 'onleihe-api.js');
}

const { checkAvailability, OnleiheApiError } = self.OnleiheApi;
const browserApi = self.OnleiheBrowser;

function errorResponse(error) {
    if (error instanceof OnleiheApiError) {
        return { success: false, reason: error.reason, detail: error.detail };
    }
    return { success: false, reason: 'unexpected', detail: error?.message };
}

async function handleCheckAvailability(request) {
    try {
        const result = await checkAvailability({
            onleiheId: request.onleiheId,
            libraryId: request.libraryId,
            searchTerm: request.searchTerm
        });
        return { success: true, ...result };
    } catch (error) {
        return errorResponse(error);
    }
}

browserApi.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request?.action !== 'check_availability') {
        return false;
    }

    handleCheckAvailability(request).then(sendResponse);
    return true; // Antwort erfolgt asynchron.
});
