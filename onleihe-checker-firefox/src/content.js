// Content script for Amazon pages
// Use browser API that works in both Chrome and Firefox
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Check if we're on an Amazon product page
if (window.location.href.includes('/dp/') || window.location.href.includes('/gp/product/')) {
  console.log('Onleihe Checker: Amazon product page detected');
  initializeOnleiheChecker();
}

async function initializeOnleiheChecker() {
  try {
    // Get saved library
    const result = await browserAPI.storage.local.get(['selectedOnleiheLibraryURL', 'selectedOnleiheLibraryName']);
    
    if (!result.selectedOnleiheLibraryURL) {
      console.log('Onleihe Checker: No library selected');
      return;
    }
    
    // Extract book information
    const bookInfo = extractBookInfo();
    if (!bookInfo.title) {
      console.log('Onleihe Checker: Could not extract book title');
      return;
    }
    
    console.log('Onleihe Checker: Extracted book info:', bookInfo);
    
    // Add Onleihe check button
    addOnleiheButton(bookInfo, result.selectedOnleiheLibraryURL, result.selectedOnleiheLibraryName);
    
  } catch (error) {
    console.error('Onleihe Checker initialization failed:', error);
  }
}

function extractBookInfo() {
  const bookInfo = {
    title: '',
    author: '',
    isbn: ''
  };
  
  // Try different selectors for title
  const titleSelectors = [
    '#productTitle',
    '.product-title',
    'h1[data-automation-id="title"]',
    'h1.a-size-large'
  ];
  
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      bookInfo.title = element.textContent.trim();
      break;
    }
  }
  
  // Try to find author
  const authorSelectors = [
    '.author .a-link-normal',
    '.by-author .a-link-normal',
    '[data-automation-id="author-strip"] .a-link-normal'
  ];
  
  for (const selector of authorSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      bookInfo.author = element.textContent.trim();
      break;
    }
  }
  
  // Try to find ISBN
  const detailsText = document.body.textContent;
  const isbnMatch = detailsText.match(/ISBN[-\s]?(?:10|13)?[-\s]?:?\s*(\d{9,13}[\dXx])/i);
  if (isbnMatch) {
    bookInfo.isbn = isbnMatch[1];
  }
  
  return bookInfo;
}

function addOnleiheButton(bookInfo, libraryUrl, libraryName) {
  // Find a good place to insert the button
  const insertTargets = [
    '#buybox',
    '#desktop_buybox',
    '.buybox-container',
    '#rightCol',
    '#apex_desktop'
  ];
  
  let targetElement = null;
  for (const selector of insertTargets) {
    targetElement = document.querySelector(selector);
    if (targetElement) break;
  }
  
  if (!targetElement) {
    console.log('Onleihe Checker: Could not find insertion point');
    return;
  }
  
  // Create Onleihe checker container
  const container = document.createElement('div');
  container.style.cssText = `
    margin: 15px 0;
    padding: 15px;
    border: 2px solid #ff9900;
    border-radius: 8px;
    background: #fef9e7;
    font-family: Arial, sans-serif;
  `;
  
  container.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 10px;">
      <span style="font-size: 20px; margin-right: 8px;">📚</span>
      <strong style="color: #0066c0;">Onleihe Verfügbarkeit prüfen</strong>
    </div>
    <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
      Ausgewählte Bibliothek: ${libraryName}
    </div>
    <button id="onleihe-check-btn" style="
      width: 100%;
      padding: 10px;
      background: #ff9900;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
    ">
      Verfügbarkeit prüfen
    </button>
    <div id="onleihe-result" style="margin-top: 10px; display: none;"></div>
  `;
  
  // Insert before the target element
  targetElement.parentNode.insertBefore(container, targetElement);
  
  // Add click handler
  const button = container.querySelector('#onleihe-check-btn');
  const resultDiv = container.querySelector('#onleihe-result');
  
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Prüfe...';
    resultDiv.style.display = 'none';
    
    try {
      // Create search term
      let searchTerm = bookInfo.title;
      if (bookInfo.author) {
        searchTerm += ` ${bookInfo.author}`;
      }
      
      // Send message to background script
      const response = await browserAPI.runtime.sendMessage({
        action: 'checkOnleihe',
        data: {
          libraryUrl: libraryUrl,
          searchTerm: searchTerm,
          isbn: bookInfo.isbn
        }
      });
      
      displayResult(response, resultDiv, libraryUrl, searchTerm);
      
    } catch (error) {
      console.error('Onleihe check failed:', error);
      displayError(resultDiv, 'Fehler bei der Abfrage');
    } finally {
      button.disabled = false;
      button.textContent = 'Verfügbarkeit prüfen';
    }
  });
}

function displayResult(response, resultDiv, libraryUrl, searchTerm) {
  resultDiv.style.display = 'block';
  
  if (response.error) {
    displayError(resultDiv, response.error);
    return;
  }
  
  if (response.found) {
    resultDiv.innerHTML = `
      <div style="color: #007600; font-weight: bold;">
        ✅ ${response.count} Treffer gefunden!
      </div>
      <a href="${response.url}" target="_blank" style="
        display: inline-block;
        margin-top: 8px;
        padding: 6px 12px;
        background: #007600;
        color: white;
        text-decoration: none;
        border-radius: 3px;
        font-size: 12px;
      ">
        In Onleihe öffnen
      </a>
    `;
  } else {
    resultDiv.innerHTML = `
      <div style="color: #cc6600;">
        ❌ Nicht in der Onleihe verfügbar
      </div>
      <a href="${response.url || libraryUrl}" target="_blank" style="
        display: inline-block;
        margin-top: 8px;
        padding: 6px 12px;
        background: #cc6600;
        color: white;
        text-decoration: none;
        border-radius: 3px;
        font-size: 12px;
      ">
        Onleihe durchsuchen
      </a>
    `;
  }
}

function displayError(resultDiv, error) {
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = `
    <div style="color: #cc0000;">
      ❌ ${error}
    </div>
  `;
}