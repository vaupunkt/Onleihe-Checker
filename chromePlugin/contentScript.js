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
        console.log("ISBN found:", matches[0]);
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
      console.log("Title found:", element.textContent);
      return element.textContent.trim();
    }
  }
  console.log("No title found");
  return null;
}

// Prüfen ob Buch in Bibliothek verfügbar ist
async function checkAvailability(isbn) {
  try {
    const response = await fetch(`http://127.0.0.1:5000/books/${isbn}`);
    const data = await response.json();
    console.log("API response:", data);
    return data.available;
  } catch (error) {
    console.error("Error checking availability:", error);
    return false;
  }
}

async function checkAvailabilityByTitle(title) {
  try {
    const response = await fetch(
      `http://127.0.0.1:5000/title/${decodeURI(title)}`
    );
    const data = await response.json();
    console.log("API response:", data);
    return data.length > 0;
  } catch (error) {
    console.error("Error checking availability:", error);
    return false;
  }
}

// Verfügbarkeitsanzeige einfügen
function showAvailability(available) {
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
    container.style.backgroundColor = "#4CAF50";
    container.style.color = "white";
    container.textContent = "Dieses Buch ist in deiner Bibliothek verfügbar!";
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

  // Warte kurz, bis die Seite vollständig geladen ist
  await new Promise((resolve) => setTimeout(resolve, 100));

  const isbn = findISBN();
  const title = findBookTitle();

  if (isbn) {
    console.log("ISBN gefunden:", isbn);
    const available = await checkAvailability(isbn);

    if (available === false) {
      if (title) {
        console.log("Titel gefunden:", title);
        const available = await checkAvailabilityByTitle(title);
        console.log("Verfügbarkeit:", available);
        showAvailability(available);
      }
    } else {
      showAvailability(available);
    }
  } else {
    console.log("Keine Daten gefunden");
  }
}

// Ausführung wenn Seite geladen ist
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePlugin);
} else {
  initializePlugin();
}

// Zusätzlicher Event Listener für dynamisch nachgeladene Inhalte
window.addEventListener("load", initializePlugin);
