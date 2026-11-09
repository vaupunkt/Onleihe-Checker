// Onleihe Checker – sunset release
//
// This version makes NO network requests. It
//   1. deletes all stored data on install/update
//      (selected library, language, settings) and
//   2. opens the discontinuation notice page once.

const api = globalThis.browser ?? globalThis.chrome;

async function clearStoredData() {
    for (const area of ['local', 'sync']) {
        try {
            await api.storage[area]?.clear();
        } catch (error) {
            console.warn(`Onleihe Checker: could not clear storage.${area}`, error);
        }
    }
}

api.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== 'install' && reason !== 'update') return;

    await clearStoredData();
    await api.tabs.create({ url: api.runtime.getURL('sunset.html') });
});
