document.addEventListener('DOMContentLoaded', async () => {
    // Wait for localization to be available
    const waitForLocalization = () => {
        return new Promise((resolve) => {
            if (typeof window.t === 'function') {
                resolve();
            } else {
                setTimeout(() => waitForLocalization().then(resolve), 50);
            }
        });
    };
    
    await waitForLocalization();
    
    // Load saved language preference and set it
    const result = await chrome.storage.local.get(['selectedLanguage']);
    if (result.selectedLanguage) {
        window.setLanguage(result.selectedLanguage);
    }
    
    // Apply localization to all elements with data-i18n attributes
    const applyLocalization = () => {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = t(key);
        });
        
        // Apply localization to placeholder attributes
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = t(key);
        });
    };
    
    applyLocalization();

    const languageSelect = document.getElementById('language-select');
    const librarySearch = document.getElementById('library-search');
    const libraryDropdown = document.getElementById('library-dropdown');
    const saveLibraryBtn = document.getElementById('save-library-btn');
    const messageBox = document.getElementById('message');

    // Set language selector to current language
    languageSelect.value = window.getCurrentLanguage();

    // Language switcher event listener
    languageSelect.addEventListener('change', async (e) => {
        const selectedLang = e.target.value;
        window.setLanguage(selectedLang);
        
        // Save language preference
        await chrome.storage.local.set({ selectedLanguage: selectedLang });
        
        // Re-apply localization
        applyLocalization();
        
        // Re-render dropdown with new language
        if (allLibraries.length > 0) {
            renderDropdown(filteredLibraries);
        }
        
        // Notify all tabs about language change
        try {
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                if (tab.url && tab.url.includes('amazon.')) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: "language_changed",
                        language: selectedLang
                    }).catch(() => {
                        // Ignore errors for tabs that don't have the content script
                    });
                }
            }
        } catch (error) {
            console.log('Could not notify tabs about language change:', error);
        }
        
        showMessage(t('popup.language.changed'), 'success');
    });

    let allLibraries = [];
    let filteredLibraries = [];
    let selectedLibrary = null;
    let isDropdownOpen = false;

    // Funktion zum Anzeigen von Nachrichten
    function showMessage(msg, type = 'info') {
        messageBox.textContent = msg;
        messageBox.className = `message-box ${type}-box`;
        messageBox.classList.remove('hidden');
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 3000);
    }

    // Funktion zum Mappen von Länderkürzeln zu vollständigen Namen
    function getCountryFullName(code) {
        return t(`country.${code}`);
    }

    // Funktion zum Rendern der Dropdown-Optionen
    function renderDropdown(librariesToShow) {
        libraryDropdown.innerHTML = '';

        if (librariesToShow.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'dropdown-item';
            noResults.textContent = t('popup.no.libraries');
            noResults.style.fontStyle = 'italic';
            libraryDropdown.appendChild(noResults);
            return;
        }

        // Gruppiere Bibliotheken nach Land
        const groupedLibraries = librariesToShow.reduce((acc, lib) => {
            const country = lib.country || 'other';
            if (!acc[country]) {
                acc[country] = [];
            }
            acc[country].push(lib);
            return acc;
        }, {});

        // Sortiere Länder (Deutschland zuerst)
        const sortedCountries = Object.keys(groupedLibraries).sort((a, b) => {
            if (a === 'de') return -1;
            if (b === 'de') return 1;
            return getCountryFullName(a).localeCompare(getCountryFullName(b));
        });

        sortedCountries.forEach(countryCode => {
            // Länder-Header hinzufügen
            const groupHeader = document.createElement('div');
            groupHeader.className = 'dropdown-group';
            groupHeader.textContent = getCountryFullName(countryCode);
            libraryDropdown.appendChild(groupHeader);

            // Bibliotheken sortieren und hinzufügen
            const sortedLibraries = groupedLibraries[countryCode].sort((a, b) => 
                a.name.localeCompare(b.name)
            );

            sortedLibraries.forEach(lib => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.textContent = lib.name;
                item.dataset.baseUrl = lib.baseURL;
                item.dataset.name = lib.name;

                item.addEventListener('click', () => {
                    selectLibrary(lib);
                });

                libraryDropdown.appendChild(item);
            });
        });
    }

    // Funktion zum Auswählen einer Bibliothek
    function selectLibrary(library) {
        selectedLibrary = library;
        librarySearch.value = library.name;
        closeDropdown();
    }

    // Dropdown öffnen
    function openDropdown() {
        isDropdownOpen = true;
        libraryDropdown.style.display = 'block';
    }

    // Dropdown schließen
    function closeDropdown() {
        isDropdownOpen = false;
        libraryDropdown.style.display = 'none';
    }

    // Bibliotheken filtern
    function filterLibraries(searchTerm) {
        if (searchTerm.length === 0) {
            filteredLibraries = [...allLibraries];
        } else {
            filteredLibraries = allLibraries.filter(lib => 
                lib.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        renderDropdown(filteredLibraries);
    }

    // Bibliotheksliste laden
    try {
        const response = await fetch(chrome.runtime.getURL('libraries.json'));
        allLibraries = await response.json();

        if (allLibraries && allLibraries.length > 0) {
            filteredLibraries = [...allLibraries];
            renderDropdown(filteredLibraries);

            // Gespeicherte Bibliothek laden
            chrome.storage.local.get(['selectedOnleiheLibraryURL', 'selectedOnleiheLibraryName'], (result) => {
                if (result.selectedOnleiheLibraryURL && result.selectedOnleiheLibraryName) {
                    // Zuerst nach URL UND Name suchen für exakte Übereinstimmung
                    let savedLibrary = allLibraries.find(lib => 
                        lib.baseURL === result.selectedOnleiheLibraryURL && 
                        lib.name === result.selectedOnleiheLibraryName
                    );
                    
                    // Fallback: nur nach URL suchen, falls exakte Übereinstimmung nicht gefunden
                    if (!savedLibrary) {
                        savedLibrary = allLibraries.find(lib => lib.baseURL === result.selectedOnleiheLibraryURL);
                    }
                    
                    if (savedLibrary) {
                        selectedLibrary = savedLibrary;
                        librarySearch.value = savedLibrary.name;
                        showMessage(t('popup.current.library', savedLibrary.name));
                    }
                } else {
                    showMessage(t('popup.please.select'));
                }
            });
        } else {
            showMessage(t('popup.error.loading'), 'error');
        }
    } catch (error) {
        console.error('Fehler beim Laden der Bibliotheken:', error);
        showMessage(t('popup.error.loading'), 'error');
    }

    // Event Listener für das Suchfeld
    librarySearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        filterLibraries(searchTerm);
        
        if (!isDropdownOpen && searchTerm.length > 0) {
            openDropdown();
        }
        
        // Reset selection wenn der Text nicht mehr mit der ausgewählten Bibliothek übereinstimmt
        if (selectedLibrary && selectedLibrary.name !== searchTerm) {
            selectedLibrary = null;
        }
    });

    // Dropdown bei Fokus öffnen
    librarySearch.addEventListener('focus', () => {
        if (filteredLibraries.length > 0) {
            openDropdown();
        }
    });

    // Dropdown bei Klick außerhalb schließen
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            closeDropdown();
        }
    });

    // Event Listener für "Bibliothek speichern" Button
    saveLibraryBtn.addEventListener('click', () => {
        if (!selectedLibrary) {
            showMessage(t('popup.error.select'), 'error');
            return;
        }

        chrome.storage.local.set({ 
            selectedOnleiheLibraryURL: selectedLibrary.baseURL,
            selectedOnleiheLibraryName: selectedLibrary.name
        }, () => {
            showMessage(t('popup.library.saved', selectedLibrary.name), 'success');
        });
    });
});
