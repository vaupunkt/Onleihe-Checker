// Connect to API/Database
async function getLibraries() {
  try {
    const response = await fetch("http://164.90.234.103:8000/libraries");
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

// Load libraries into dropdown
async function populateLibrarySelect() {
  const select = document.getElementById("librarySelect");
  const libraries = await getLibraries();

  libraries.forEach((library) => {
    const option = document.createElement("option");
    option.value = library.id;
    option.textContent = library.name;
    select.appendChild(option);
  });

  // Restore saved selection
  chrome.storage.sync.get(["selectedLibrary"], function (result) {
    if (result.selectedLibrary) {
      select.value = result.selectedLibrary;
    }
  });
}

// Event listener for changes
document
  .getElementById("librarySelect")
  .addEventListener("change", function (e) {
    const selectedLibrary = e.target.value;
    chrome.storage.sync.set({ selectedLibrary: selectedLibrary }, function () {
      const status = document.getElementById("status");
      status.textContent = "Settings saved!";
      status.style.backgroundColor = "#4CAF50";
      status.style.color = "white";
    });
  });

// Initialization
document.addEventListener("DOMContentLoaded", populateLibrarySelect);
