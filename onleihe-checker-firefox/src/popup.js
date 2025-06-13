// Use browser API that works in both Chrome and Firefox
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

let libraries = [];

// Load libraries and initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadLibraries();
    await loadSavedLibrary();
    setupEventListeners();
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    showError('Fehler beim Laden der Bibliotheken');
  }
});

async function loadLibraries() {
  try {
    // Try to load from extension bundle first
    const response = await fetch(browserAPI.runtime.getURL('src/libraries.json'));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    libraries = await response.json();
    console.log(`Loaded ${libraries.length} libraries`);
    
    if (libraries.length === 0) {
      throw new Error('No libraries found in data');
    }
    
    populateLibraryDropdown();
    
  } catch (error) {
    console.error('Error loading libraries:', error);
    showError(`Fehler beim Laden der Bibliotheken: ${error.message}`);
  }
}

function populateLibraryDropdown() {
  const select = document.getElementById('librarySelect');
  if (!select) {
    console.error('Library select element not found');
    return;
  }
  
  // Clear existing options
  select.innerHTML = '<option value="">Bibliothek auswählen...</option>';
  
  // Sort libraries by name
  const sortedLibraries = libraries.sort((a, b) => a.name.localeCompare(b.name));
  
  // Add options
  sortedLibraries.forEach(library => {
    const option = document.createElement('option');
    option.value = JSON.stringify({
      name: library.name,
      baseURL: library.baseURL
    });
    option.textContent = library.name;
    select.appendChild(option);
  });
  
  console.log(`Added ${sortedLibraries.length} libraries to dropdown`);
}

async function loadSavedLibrary() {
  try {
    const result = await browserAPI.storage.local.get(['selectedOnleiheLibraryURL', 'selectedOnleiheLibraryName']);
    
    if (result.selectedOnleiheLibraryURL && result.selectedOnleiheLibraryName) {
      // Find and select the saved library
      const select = document.getElementById('librarySelect');
      const savedLibrary = {
        name: result.selectedOnleiheLibraryName,
        baseURL: result.selectedOnleiheLibraryURL
      };
      
      for (let option of select.options) {
        if (option.value) {
          const libraryData = JSON.parse(option.value);
          if (libraryData.baseURL === savedLibrary.baseURL) {
            option.selected = true;
            break;
          }
        }
      }
      
      updateStatus(`Gespeicherte Bibliothek: ${result.selectedOnleiheLibraryName}`);
    }
  } catch (error) {
    console.error('Error loading saved library:', error);
  }
}

function setupEventListeners() {
  const saveButton = document.getElementById('saveLibrary');
  const select = document.getElementById('librarySelect');
  const searchInput = document.getElementById('librarySearch');
  
  if (saveButton) {
    saveButton.addEventListener('click', saveSelectedLibrary);
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', filterLibraries);
  }
}

function filterLibraries() {
  const searchTerm = document.getElementById('librarySearch').value.toLowerCase();
  const select = document.getElementById('librarySelect');
  
  // Show all options if search is empty
  if (!searchTerm) {
    populateLibraryDropdown();
    return;
  }
  
  // Filter libraries
  const filteredLibraries = libraries.filter(library => 
    library.name.toLowerCase().includes(searchTerm)
  );
  
  // Update dropdown
  select.innerHTML = '<option value="">Bibliothek auswählen...</option>';
  
  filteredLibraries.forEach(library => {
    const option = document.createElement('option');
    option.value = JSON.stringify({
      name: library.name,
      baseURL: library.baseURL
    });
    option.textContent = library.name;
    select.appendChild(option);
  });
}

async function saveSelectedLibrary() {
  const select = document.getElementById('librarySelect');
  
  if (!select.value) {
    showError('Bitte wählen Sie eine Bibliothek aus');
    return;
  }
  
  try {
    const libraryData = JSON.parse(select.value);
    
    await browserAPI.storage.local.set({
      selectedOnleiheLibraryURL: libraryData.baseURL,
      selectedOnleiheLibraryName: libraryData.name
    });
    
    updateStatus(`Bibliothek gespeichert: ${libraryData.name}`);
    
  } catch (error) {
    console.error('Error saving library:', error);
    showError('Fehler beim Speichern der Bibliothek');
  }
}

function updateStatus(message) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.className = 'status success';
  }
}

function showError(message) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.className = 'status error';
  }
}