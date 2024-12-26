// Verbindung zur API/Datenbank herstellen
async function getLibraries() {
  try {
    const response = await fetch("http://127.0.0.1:5000/libraries");
    const libraries = await response.json();
    const sortedLibraries = libraries.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return sortedLibraries;
  } catch (error) {
    console.error("Error fetching libraries:", error);
    return [];
  }
}

// Bibliotheken in Dropdown laden
async function populateLibrarySelect() {
  const select = document.getElementById("librarySelect");
  const libraries = await getLibraries();

  libraries.forEach((library) => {
    const option = document.createElement("option");
    option.value = library.id;
    option.textContent = library.name;
    select.appendChild(option);
  });

  // Gespeicherte Auswahl wiederherstellen
  chrome.storage.sync.get(["selectedLibrary"], function (result) {
    if (result.selectedLibrary) {
      select.value = result.selectedLibrary;
    }
  });
}

// Event Listener für Änderungen
document
  .getElementById("librarySelect")
  .addEventListener("change", function (e) {
    const selectedLibrary = e.target.value;
    chrome.storage.sync.set({ selectedLibrary: selectedLibrary }, function () {
      const status = document.getElementById("status");
      status.textContent = "Einstellungen gespeichert!";
      status.style.backgroundColor = "#4CAF50";
      status.style.color = "white";
    });
  });

// Initialisierung
document.addEventListener("DOMContentLoaded", populateLibrarySelect);
