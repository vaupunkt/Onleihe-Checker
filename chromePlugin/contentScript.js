// ISBN auf Amazon-Seite finden
function findISBN() {
  // Verschiedene Möglichkeiten, die ISBN zu finden
  const possibleISBNSelectors = [
    "#rpi-attribute-book_details-isbn13 .a-section.a-spacing-none.a-text-center.rpi-attribute-value span", // Neues Amazon Format
  ];

  for (const selector of possibleISBNSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.textContent.split("-").join("");
      const matches = text.match(/\b\d{13}\b/);
      if (matches) {
        return matches[0];
      }
    }
  }
  console.log("No ISBN found");
  return null;
}

function findBookTitle() {
  // Verschiedene Möglichkeiten, den Titel zu finden
  const possibleTitleSelectors = [
    "#productTitle", // Neues Amazon Format
  ];

  for (const selector of possibleTitleSelectors) {
    const element = document.querySelector(selector);
    if (element.textContent) {
      return element.textContent.trim();
    }
  }
  console.log("No title found");
  return null;
}

// Prüfen ob Buch in Bibliothek verfügbar ist
async function checkAvailability(isbn, libraryId) {
  try {
    const response = await fetch(
      `http://127.0.0.1:5000/books/${isbn}?library=${libraryId}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking availability:", error);
    return false;
  }
}

async function checkAvailabilityByTitle(title, libraryId) {
  try {
    const response = await fetch(
      `http://127.0.0.1:5000/title/${decodeURI(title)}?library=${libraryId}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking availability:", error);
    return false;
  }
}

// Verfügbarkeitsanzeige einfügen
async function showAvailability(available, isbn) {
  // Entferne vorhandene Anzeige falls vorhanden
  const existingContainer = document.getElementById("onleihe-availability");
  if (existingContainer) {
    existingContainer.remove();
  }

  const container = document.createElement("div");
  container.id = "onleihe-availability";
  container.style.padding = "10px";
  container.style.margin = "10px 0";
  container.style.borderRadius = "5px";
  container.style.fontSize = "16px";
  container.style.fontWeight = "bold";
  container.style.textAlign = "center";

  if (available) {
    const { selectedLibrary } = await chrome.storage.sync.get([
      "selectedLibrary",
    ]);
    const title = await checkAvailability(isbn, selectedLibrary);
    const library = await getLibraryData(selectedLibrary);
    const linkToTitle = library.baseURL + "/frontend/" + title.link;

    const link = document.createElement("a");
    link.href = linkToTitle;
    link.textContent = "Zum Buch";
    link.target = "_blank";
    link.style.color = "white";
    link.style.textDecoration = "underline";
    link.style.marginLeft = "10px";

    container.style.backgroundColor = "#4CAF50";
    container.style.color = "white";
    container.textContent = "Dieses Buch ist in deiner Bibliothek verfügbar!";
    container.appendChild(link);
  } else {
    container.style.backgroundColor = "#f44336";
    container.style.color = "white";
    container.textContent =
      "Dieses Buch ist in deiner Bibliothek nicht verfügbar.";
  }

  // Verschiedene Möglichkeiten, wo die Anzeige eingefügt werden kann
  const insertionPoints = [
    document.getElementById("buybox"),
    document.getElementById("dp"),
    document.querySelector(".dp-container"),
  ];

  for (const point of insertionPoints) {
    if (point) {
      point.insertAdjacentElement("beforebegin", container);
      console.log("Availability container inserted");
      break;
    }
  }
}

// Hauptfunktion
async function initializePlugin() {
  console.log("Amazon-Plugin wird initialisiert...");

  // Wait for page to load
  await new Promise((resolve) => setTimeout(resolve, 100));

  const isbn = findISBN();
  const title = findBookTitle();

  // Get selected library
  const { selectedLibrary } = await chrome.storage.sync.get([
    "selectedLibrary",
  ]);

  if (!selectedLibrary) {
    console.log("No library selected");
    return;
  }

  // Check availability by ISBN first
  if (isbn) {
    const isbnAvailability = await checkAvailability(isbn, selectedLibrary);
    if (isbnAvailability.available === false) {
      // If ISBN check fails, try title
      if (title) {
        const titleAvailability = await checkAvailabilityByTitle(
          title,
          selectedLibrary
        );
        if (titleAvailability) {
          showAvailability(titleAvailability.available, titleAvailability.isbn);
          return;
        }
      }
    } else {
      showAvailability(isbnAvailability.available, isbn);
      return;
    }
  }

  console.log("No availability data found");
}

// Ausführung wenn Seite geladen ist
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePlugin);
} else {
  initializePlugin();
}

// Zusätzlicher Event Listener für dynamisch nachgeladene Inhalte
window.addEventListener("load", initializePlugin);

async function getLibraryData(libraryId) {
  try {
    const response = await fetch("http://127.0.0.1:5000/library/" + libraryId);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting library data:", error);
    return false;
  }
}
