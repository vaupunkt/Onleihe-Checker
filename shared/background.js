// background.js - service worker.
//
// Accepts search requests from the content script and forwards them to
// api.onleihe.de. The detour through the background script is necessary because
// the content script runs on amazon.de/goodreads.com and may not make a
// cross-origin request to Onleihe from there - the host permission applies here.

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
    return true; // The response is sent asynchronously.
});
