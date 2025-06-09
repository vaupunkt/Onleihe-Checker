document.addEventListener('DOMContentLoaded', async () => {
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
    
    const result = await chrome.storage.local.get(['selectedLanguage']);
    if (result.selectedLanguage) {
        window.setLanguage(result.selectedLanguage);
    }
    
    const applyLocalization = () => {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = t(key);
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = t(key);
        });
    };
    
    applyLocalization();

    const languageSelect = document.getElementById('language-select');
    const librarySearch = document.getElementById('library-search');
    const libraryDropdown = document.getElementById('library-dropdown');
    const saveLibraryButton = document.getElementById('save-library-btn');
    const messageBox = document.getElementById('message');

    languageSelect.value = window.getCurrentLanguage();

    languageSelect.addEventListener('change', async (e) => {
        const selectedLanguage = e.target.value;
        window.setLanguage(selectedLanguage);
        
        await chrome.storage.local.set({ selectedLanguage: selectedLanguage });
        
        applyLocalization();
        
        if (allLibraries.length > 0) {
            renderDropdown(filteredLibraries);
        }
        
        try {
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                if (tab.url && tab.url.includes('amazon.')) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: "language_changed",
                        language: selectedLanguage
                    }).catch(() => {});
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

    function showMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}-box`;
        messageBox.classList.remove('hidden');
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 3000);
    }

    function getCountryFullName(code) {
        return t(`country.${code}`);
    }

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

        const groupedLibraries = librariesToShow.reduce((acc, lib) => {
            const country = lib.country || 'other';
            if (!acc[country]) {
                acc[country] = [];
            }
            acc[country].push(lib);
            return acc;
        }, {});

        const sortedCountries = Object.keys(groupedLibraries).sort((a, b) => {
            if (a === 'de') return -1;
            if (b === 'de') return 1;
            return getCountryFullName(a).localeCompare(getCountryFullName(b));
        });

        sortedCountries.forEach(countryCode => {
            const groupHeader = document.createElement('div');
            groupHeader.className = 'dropdown-group';
            groupHeader.textContent = getCountryFullName(countryCode);
            libraryDropdown.appendChild(groupHeader);

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

    function selectLibrary(library) {
        selectedLibrary = library;
        librarySearch.value = library.name;
        closeDropdown();
    }

    function openDropdown() {
        isDropdownOpen = true;
        libraryDropdown.style.display = 'block';
    }

    function closeDropdown() {
        isDropdownOpen = false;
        libraryDropdown.style.display = 'none';
    }

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

    try {
        const response = await fetch(chrome.runtime.getURL('libraries.json'));
        allLibraries = await response.json();

        if (allLibraries && allLibraries.length > 0) {
            filteredLibraries = [...allLibraries];
            renderDropdown(filteredLibraries);

            chrome.storage.local.get(['selectedOnleiheLibraryURL', 'selectedOnleiheLibraryName'], (result) => {
                if (result.selectedOnleiheLibraryURL && result.selectedOnleiheLibraryName) {
                    let savedLibrary = allLibraries.find(lib => 
                        lib.baseURL === result.selectedOnleiheLibraryURL && 
                        lib.name === result.selectedOnleiheLibraryName
                    );
                    
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
        console.error('Error loading libraries:', error);
        showMessage(t('popup.error.loading'), 'error');
    }

    librarySearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        filterLibraries(searchTerm);
        
        if (!isDropdownOpen && searchTerm.length > 0) {
            openDropdown();
        }
        
        if (selectedLibrary && selectedLibrary.name !== searchTerm) {
            selectedLibrary = null;
        }
    });

    librarySearch.addEventListener('focus', () => {
        if (filteredLibraries.length > 0) {
            openDropdown();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            closeDropdown();
        }
    });

    saveLibraryButton.addEventListener('click', () => {
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
