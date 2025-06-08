document.addEventListener('DOMContentLoaded', async () => {
    const librarySelect = document.getElementById('library-select');
    const searchInput = document.getElementById('search-input');
    const saveLibraryBtn = document.getElementById('save-library-btn');
    const messageBox = document.getElementById('message');

    let allLibraries = [];
    let displayedLibraries = [];
    let selectedLibraryBaseURL = null;
    let selectedLibraryName = null;

    // Funktion zum Anzeigen von Nachrichten
    function showMessage(msg, type = 'info') {
        messageBox.textContent = msg;
        messageBox.className = `message-box ${type === 'error' ? 'bg-red-100 text-red-800 error-box' : type === 'success' ? 'bg-green-100 text-green-800 success-box' : 'bg-blue-100 text-blue-800'}`;
        messageBox.classList.remove('hidden');
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 3000);
    }

    // Funktion zum Mappen von Länderkürzeln zu vollständigen Namen (für Optgroup)
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

    // Funktion zum Rendern (Anzeigen) der Bibliotheken im Dropdown
    function renderLibraries(librariesToDisplay, currentSelectedValue = null) {
        librarySelect.innerHTML = ''; // Vorherige Optionen löschen

        const groupedLibraries = librariesToDisplay.reduce((acc, lib) => {
            const country = lib.country || 'other';
            if (!acc[country]) {
                acc[country] = [];
            }
            acc[country].push(lib);
            return acc;
        }, {});

        const sortedCountries = Object.keys(groupedLibraries).sort((a, b) => {
            if (a === 'de') return -1; // Deutschland zuerst
            if (b === 'de') return 1;
            return getCountryFullName(a).localeCompare(getCountryFullName(b));
        });

        sortedCountries.forEach(countryCode => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = getCountryFullName(countryCode);
            
            const sortedGroup = groupedLibraries[countryCode].sort((a, b) => 
                a.name.localeCompare(b.name)
            );

            sortedGroup.forEach(lib => {
                const option = document.createElement('option');
                option.value = lib.baseURL;
                option.textContent = lib.name;
                optgroup.appendChild(option);
            });
            librarySelect.appendChild(optgroup);
        });

        if (currentSelectedValue) {
            librarySelect.value = currentSelectedValue;
        }
    }

    // Bibliotheksliste laden
    try {
        const response = await fetch(chrome.runtime.getURL('libraries.json'));
        allLibraries = await response.json();

        if (allLibraries && allLibraries.length > 0) {
            displayedLibraries = [...allLibraries];
            renderLibraries(displayedLibraries);

            chrome.storage.local.get(['selectedOnleiheLibraryURL', 'selectedOnleiheLibraryName'], (result) => {
                if (result.selectedOnleiheLibraryURL) {
                    librarySelect.value = result.selectedOnleiheLibraryURL;
                    selectedLibraryBaseURL = result.selectedOnleiheLibraryURL;
                    selectedLibraryName = result.selectedOnleiheLibraryName || librarySelect.options[librarySelect.selectedIndex].textContent;
                    showMessage(`Deine Standardbibliothek ist: ${selectedLibraryName}`);
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
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm.length >= 2 || searchTerm.length === 0) {
            displayedLibraries = allLibraries.filter(lib => 
                lib.name.toLowerCase().includes(searchTerm)
            );
            renderLibraries(displayedLibraries, librarySelect.value);
        }
    });

    // Event Listener für "Bibliothek speichern" Button
    saveLibraryBtn.addEventListener('click', () => {
        const selectedValue = librarySelect.value;
        const selectedText = librarySelect.options[librarySelect.selectedIndex].textContent;
        chrome.storage.local.set({ 
            selectedOnleiheLibraryURL: selectedValue,
            selectedOnleiheLibraryName: selectedText
        }, () => {
            selectedLibraryBaseURL = selectedValue;
            selectedLibraryName = selectedText;
            showMessage(`"${selectedText}" wurde als Standardbibliothek gespeichert.`, 'success');
        });
    });
});
