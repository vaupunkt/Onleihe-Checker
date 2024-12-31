// Find ISBN on Amazon page
function findISBN() {
  // Different ways to find the ISBN
  const possibleISBNSelectors = [
    "#rpi-attribute-book_details-isbn13 .a-section.a-spacing-none.a-text-center.rpi-attribute-value span", // New Amazon Format
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
  // Different ways to find the title
  const possibleTitleSelectors = [
    "#productTitle", // New Amazon Format
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

// Check if book is available in library
async function checkAvailability(isbn, libraryId) {
  try {
    const response = await fetch(
      `http://164.90.234.103:8000/books/${isbn}?library=${libraryId}`
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
      `http://164.90.234.103:8000/title/${decodeURI(
        title
      )}?library=${libraryId}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking availability:", error);
    return false;
  }
}

// Insert availability display
async function showAvailability(available, isbn) {
  // Remove existing display if present
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
    link.textContent = "Go to Book";
    link.target = "_blank";
    link.style.color = "white";
    link.style.textDecoration = "underline";
    link.style.marginLeft = "10px";

    container.style.backgroundColor = "#4CAF50";
    container.style.color = "white";
    container.textContent = "This book is available in your library!";
    container.appendChild(link);
  } else {
    container.style.backgroundColor = "#f44336";
    container.style.color = "white";
    container.textContent = "This book is not available in your library.";
  }

  // Different possible insertion points for the display
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

// Main function
async function initializePlugin() {
  console.log("Amazon plugin initializing...");

  // Wait for page to load
  await new Promise((resolve) => setTimeout(resolve, 100));

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
  container.style.backgroundColor = "#FFA500";
  container.style.color = "white";
  container.textContent = "Checking if book is available...";

  // Different possible insertion points for the display
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

// Execute when page is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePlugin);
} else {
  initializePlugin();
}

// Additional event listener for dynamically loaded content
window.addEventListener("load", initializePlugin);

async function getLibraryData(libraryId) {
  try {
    const response = await fetch(
      "http://164.90.234.103:8000/library/" + libraryId
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting library data:", error);
    return false;
  }
}
