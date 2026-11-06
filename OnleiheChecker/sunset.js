const api = globalThis.browser ?? globalThis.chrome;

// This page is used both as the popup and as a standalone tab.
// tabs.getCurrent() returns no tab inside the popup (needs no "tabs" permission).
Promise.resolve(api.tabs.getCurrent())
    .then((tab) => {
        if (tab) document.documentElement.classList.add('page');
    })
    .catch(() => {});

const uninstallButton = document.getElementById('uninstall');
const uninstallHelp = document.getElementById('uninstall-help');

// management.uninstallSelf() needs no extra permission in Chrome or Firefox.
if (typeof api.management?.uninstallSelf !== 'function') {
    uninstallButton.hidden = true;
    uninstallHelp.open = true;
}

uninstallButton.addEventListener('click', async () => {
    try {
        await api.management.uninstallSelf({ showConfirmDialog: true });
    } catch {
        // Cancelled or not possible: show the manual removal instructions.
        uninstallHelp.open = true;
    }
});
