// popup.js - Bibliothekswahl und Sprachumschaltung.

(() => {
    'use strict';

    const { t, setLanguage, getCurrentLanguage, detectLanguage, isSupported } = self.OnleiheI18n;
    const browserApi = self.OnleiheBrowser;

    const MAX_VISIBLE_RESULTS = 60;
    const MESSAGE_TIMEOUT = 3000;

    let allLibraries = [];
    let visibleLibraries = [];
    let selectedLibrary = null;

    const elements = {};

    function cacheElements() {
        for (const id of [
            'language-select',
            'library-search',
            'library-dropdown',
            'save-library-btn',
            'message'
        ]) {
            elements[id] = document.getElementById(id);
        }
    }

    function applyLocalization() {
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            element.textContent = t(element.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
            element.placeholder = t(element.dataset.i18nPlaceholder);
        });
    }

    let messageTimer = null;

    function showMessage(text, type = 'info') {
        elements.message.textContent = text;
        // Die Klassen heißen .info-box/.success-box/.error-box - der Firefox-Build
        // setzte hier nur `${type}` und blieb deshalb ungestylt.
        elements.message.className = `message-box ${type}-box`;
        clearTimeout(messageTimer);
        messageTimer = setTimeout(() => elements.message.classList.add('hidden'), MESSAGE_TIMEOUT);
    }

    /** "Stadtbibliothek Stuttgart" plus Ort, damit gleichnamige Bibliotheken unterscheidbar sind. */
    function describeLibrary(library) {
        const location = [library.postalCode, library.city].filter(Boolean).join(' ');
        return location ? `${library.name} · ${location}` : library.name;
    }

    function renderDropdown(libraries) {
        elements['library-dropdown'].textContent = '';

        if (!libraries.length) {
            const empty = document.createElement('div');
            empty.className = 'dropdown-item';
            empty.style.fontStyle = 'italic';
            empty.textContent = t('popup.no.libraries');
            elements['library-dropdown'].append(empty);
            return;
        }

        const fragment = document.createDocumentFragment();
        for (const library of libraries.slice(0, MAX_VISIBLE_RESULTS)) {
            const item = document.createElement('div');
            item.className = 'dropdown-item';

            const name = document.createElement('div');
            name.className = 'dropdown-item-name';
            name.textContent = library.name;

            const location = document.createElement('div');
            location.className = 'dropdown-item-location';
            location.textContent = [library.postalCode, library.city].filter(Boolean).join(' ');

            item.append(name, location);
            item.addEventListener('click', () => selectLibrary(library));
            fragment.append(item);
        }

        if (libraries.length > MAX_VISIBLE_RESULTS) {
            const more = document.createElement('div');
            more.className = 'dropdown-group';
            more.textContent = `+${libraries.length - MAX_VISIBLE_RESULTS}`;
            fragment.append(more);
        }

        elements['library-dropdown'].append(fragment);
    }

    function openDropdown() {
        elements['library-dropdown'].style.display = 'block';
    }

    function closeDropdown() {
        elements['library-dropdown'].style.display = 'none';
    }

    function selectLibrary(library) {
        selectedLibrary = library;
        elements['library-search'].value = describeLibrary(library);
        closeDropdown();
    }

    /** Sucht über Name und Ort - "Stuttgart" findet auch die Stadtbibliothek. */
    function filterLibraries(term) {
        const needle = term.trim().toLowerCase();
        if (!needle) {
            visibleLibraries = allLibraries;
        } else {
            visibleLibraries = allLibraries.filter((library) =>
                `${library.name} ${library.city} ${library.postalCode}`.toLowerCase().includes(needle)
            );
        }
        renderDropdown(visibleLibraries);
    }

    async function notifyTabsAboutLanguage(language) {
        try {
            const tabs = await browserApi.tabs.query({ url: ['*://*.amazon.de/*', '*://*.goodreads.com/*'] });
            await Promise.all(
                tabs.map((tab) =>
                    browserApi.tabs
                        .sendMessage(tab.id, { action: 'language_changed', language })
                        .catch(() => {
                            // Kein Content-Script in diesem Tab - nichts zu tun.
                        })
                )
            );
        } catch {
            // tabs.query kann ohne passende Berechtigung fehlschlagen; unkritisch.
        }
    }

    async function onLanguageChange(event) {
        const language = event.target.value;
        if (!setLanguage(language)) {
            return;
        }

        await browserApi.storage.local.set({ selectedLanguage: language });
        applyLocalization();
        renderDropdown(visibleLibraries);
        await notifyTabsAboutLanguage(language);
        showMessage(t('popup.language.changed'), 'success');
    }

    async function saveSelectedLibrary() {
        if (!selectedLibrary) {
            showMessage(t('popup.error.select'), 'error');
            return;
        }

        // Ein Objekt statt zwei Einzelwerte: onleiheId und libraryId müssen
        // zusammen gespeichert werden, sonst passt das API-Token nicht.
        await browserApi.storage.local.set({ selectedLibrary });
        showMessage(t('popup.library.saved', selectedLibrary.name), 'success');
    }

    async function restoreSelection() {
        const { selectedLibrary: stored } = await browserApi.storage.local.get(['selectedLibrary']);
        if (!stored) {
            showMessage(t('popup.please.select'));
            return;
        }

        const match =
            allLibraries.find(
                (library) =>
                    library.onleiheId === stored.onleiheId && library.libraryId === stored.libraryId
            ) || stored;

        selectedLibrary = match;
        elements['library-search'].value = describeLibrary(match);
        showMessage(t('popup.current.library', match.name));
    }

    async function loadLibraries() {
        const response = await fetch(browserApi.runtime.getURL('libraries.json'));
        allLibraries = await response.json();
        visibleLibraries = allLibraries;
    }

    function wireEvents() {
        elements['language-select'].addEventListener('change', onLanguageChange);

        elements['library-search'].addEventListener('input', (event) => {
            selectedLibrary = null;
            filterLibraries(event.target.value);
            openDropdown();
        });

        elements['library-search'].addEventListener('focus', () => {
            filterLibraries(elements['library-search'].value);
            openDropdown();
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest('.search-container')) {
                closeDropdown();
            }
        });

        elements['save-library-btn'].addEventListener('click', saveSelectedLibrary);
    }

    async function initialize() {
        cacheElements();

        const { selectedLanguage } = await browserApi.storage.local.get(['selectedLanguage']);
        setLanguage(isSupported(selectedLanguage) ? selectedLanguage : detectLanguage());
        elements['language-select'].value = getCurrentLanguage();
        applyLocalization();

        wireEvents();

        try {
            await loadLibraries();
            renderDropdown(visibleLibraries);
            await restoreSelection();
        } catch (error) {
            console.error('Onleihe Checker: Bibliotheken konnten nicht geladen werden', error);
            showMessage(t('popup.error.loading'), 'error');
        }
    }

    document.addEventListener('DOMContentLoaded', initialize);
})();
