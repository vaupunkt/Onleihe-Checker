// Use browser API that works in both Chrome and Firefox
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

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
    
    const result = await browserAPI.storage.local.get(['selectedLanguage']);
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
    const messageDiv = document.getElementById('message');

    let allLibraries = [];
    let filteredLibraries = [];
    let selectedLibrary = null;

    function showMessage(message, type = 'info') {
        messageDiv.className = `message-box ${type}-box`;
        messageDiv.textContent = message;
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 3000);
    }

    function getCountryFullName(code) {
        const countries = {
            'de': 'Deutschland',
            'at': 'Österreich',
            'ch': 'Schweiz'
        };
        return countries[code] || code.toUpperCase();
    }

    function renderDropdown(librariesToShow) {
        libraryDropdown.innerHTML = '';
        
        if (librariesToShow.length === 0) {
            libraryDropdown.innerHTML = '<div class="dropdown-item" style="color: #999;">Keine Bibliotheken gefunden</div>';
            libraryDropdown.style.display = 'block';
            return;
        }

        const groupedLibraries = {};
        librariesToShow.forEach(library => {
            const country = library.country || 'de';
            if (!groupedLibraries[country]) {
                groupedLibraries[country] = [];
            }
            groupedLibraries[country].push(library);
        });

        Object.keys(groupedLibraries).sort().forEach(country => {
            const countryGroup = document.createElement('div');
            countryGroup.className = 'dropdown-group';
            countryGroup.textContent = getCountryFullName(country);
            libraryDropdown.appendChild(countryGroup);

            groupedLibraries[country].sort((a, b) => a.name.localeCompare(b.name)).forEach(library => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.textContent = library.name;
                item.onclick = () => selectLibrary(library);
                libraryDropdown.appendChild(item);
            });
        });

        libraryDropdown.style.display = 'block';
    }

    function selectLibrary(library) {
        selectedLibrary = library;
        librarySearch.value = library.name;
        closeDropdown();
        
        // Update all dropdown items to show selection
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.classList.remove('selected');
            if (item.textContent === library.name) {
                item.classList.add('selected');
            }
        });
    }

    function openDropdown() {
        if (filteredLibraries.length > 0) {
            renderDropdown(filteredLibraries);
        }
    }

    function closeDropdown() {
        libraryDropdown.style.display = 'none';
    }

    function filterLibraries(searchTerm) {
        if (!searchTerm) {
            filteredLibraries = [...allLibraries];
        } else {
            filteredLibraries = allLibraries.filter(library =>
                library.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        renderDropdown(filteredLibraries);
    }

    try {
        const response = await fetch(browserAPI.runtime.getURL('src/libraries.json'));
        allLibraries = await response.json();

        if (allLibraries && allLibraries.length > 0) {
            filteredLibraries = [...allLibraries];
            renderDropdown(filteredLibraries);

            browserAPI.storage.local.get(['selectedOnleiheLibraryURL', 'selectedOnleiheLibraryName'], (result) => {
                if (result.selectedOnleiheLibraryURL && result.selectedOnleiheLibraryName) {
                    let savedLibrary = allLibraries.find(lib => 
                        lib.baseURL === result.selectedOnleiheLibraryURL && 
                        lib.name === result.selectedOnleiheLibraryName
                    );
                    
                    if (savedLibrary) {
                        selectLibrary(savedLibrary);
                        showMessage(t('popup.current.library', savedLibrary.name), 'info');
                    }
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
        
        if (searchTerm && filteredLibraries.length > 0) {
            openDropdown();
        } else if (!searchTerm) {
            closeDropdown();
        }
    });

    librarySearch.addEventListener('focus', () => {
        if (librarySearch.value) {
            openDropdown();
        }
    });

    librarySearch.addEventListener('blur', () => {
        setTimeout(() => closeDropdown(), 150);
    });

    saveLibraryButton.addEventListener('click', () => {
        if (!selectedLibrary) {
            showMessage(t('popup.error.select'), 'error');
            return;
        }

        browserAPI.storage.local.set({
            'selectedOnleiheLibraryURL': selectedLibrary.baseURL,
            'selectedOnleiheLibraryName': selectedLibrary.name
        }, () => {
            showMessage(t('popup.library.saved', selectedLibrary.name), 'success');
        });
    });

    languageSelect.addEventListener('change', (e) => {
        const selectedLang = e.target.value;
        browserAPI.storage.local.set({ 'selectedLanguage': selectedLang }, () => {
            window.setLanguage(selectedLang);
            applyLocalization();
            showMessage(t('popup.language.changed'), 'success');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            closeDropdown();
        }
    });
});