document.addEventListener('DOMContentLoaded', async () => {
    const librarySearch = document.getElementById('library-search');
    const libraryDropdown = document.getElementById('library-dropdown');
    const saveLibraryBtn = document.getElementById('save-library-btn');
    const messageBox = document.getElementById('message');

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
        switch (code) {
            case 'de': return 'Deutschland';
            case 'at': return 'Österreich';
            case 'ch': return 'Schweiz';
            case 'be': return 'Belgien';
            case 'fr': return 'Frankreich';
            case 'it': return 'Italien';
            case 'lu': return 'Luxemburg';
            case 'li': return 'Liechtenstein';
            case 'other': return 'Sonstige (Goethe-Institut, WDA)';
            default: return 'Unbekanntes Land';
        }
    }

    // Funktion zum Rendern der Dropdown-Optionen
    function renderDropdown(librariesToShow) {
        libraryDropdown.innerHTML = '';

        if (librariesToShow.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'dropdown-item';
            noResults.textContent = 'Keine Bibliotheken gefunden';
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
                if (result.selectedOnleiheLibraryURL) {
                    const savedLibrary = allLibraries.find(lib => lib.baseURL === result.selectedOnleiheLibraryURL);
                    if (savedLibrary) {
                        selectedLibrary = savedLibrary;
                        librarySearch.value = savedLibrary.name;
                        showMessage(`Deine Standardbibliothek ist: ${savedLibrary.name}`);
                    }
                } else {
                    showMessage('Bitte wähle deine Bibliothek aus.');
                }
            });
        } else {
            showMessage('Keine Bibliotheken gefunden.', 'error');
        }
    } catch (error) {
        console.error('Fehler beim Laden der Bibliotheken:', error);
        showMessage('Fehler beim Laden der Bibliotheken.', 'error');
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
            showMessage('Bitte wähle eine Bibliothek aus.', 'error');
            return;
        }

        chrome.storage.local.set({ 
            selectedOnleiheLibraryURL: selectedLibrary.baseURL,
            selectedOnleiheLibraryName: selectedLibrary.name
        }, () => {
            showMessage(`"${selectedLibrary.name}" wurde als Standardbibliothek gespeichert.`, 'success');
        });
    });
});
