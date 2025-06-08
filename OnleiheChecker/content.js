// content.js
// Dieses Skript läuft auf Amazon.de Seiten.
console.log("Onleihe Checker: content.js wird geladen!"); // DIESER LOG MUSS ERSCHEINEN!

// Funktion zum Erstellen und Einfügen des Onleihe-Statusfelds
function injectOnleiheStatusField() {
    console.log("Onleihe Checker: Starte Suche nach geeigneten Elementen für Statusfeld-Injektion...");
    let targetElement = document.getElementById('productTitle'); // Oben beim Titel
    if (targetElement) {
        console.log("Onleihe Checker: productTitle gefunden als Ziel.");
    } else {
        console.log("Onleihe Checker: productTitle nicht gefunden. Versuche detailBulletsWrapper_feature_div...");
        targetElement = document.getElementById('detailBulletsWrapper_feature_div'); // Bei den Produktdetails
        if (targetElement) {
            console.log("Onleihe Checker: detailBulletsWrapper_feature_div gefunden als Ziel.");
        } else {
            console.log("Onleihe Checker: detailBulletsWrapper_feature_div nicht gefunden. Versuche dp-container...");
            targetElement = document.getElementById('dp-container'); // Als Fallback irgendwo sichtbar
            if (targetElement) {
                console.log("Onleihe Checker: dp-container gefunden als Ziel.");
            } else {
                console.log("Onleihe Checker: Alle spezifischen Ziele nicht gefunden. Versuche body als letzten Fallback...");
                targetElement = document.body; // Letzter Fallback: direkt in den Body einfügen
                if (targetElement) {
                    console.log("Onleihe Checker: Body als Ziel gefunden (Fallback).");
                }
            }
        }
    }

    if (!targetElement) {
        console.warn("Onleihe Checker: KEIN geeignetes Element zum Einfügen des Statusfeldes gefunden. Das Feld wird NICHT angezeigt.");
        return null;
    }

    // Prüfe, ob das Feld bereits existiert, um Doppelungen zu vermeiden
    if (document.getElementById('onleihe-checker-status')) {
        console.log("Onleihe Checker: Statusfeld existiert bereits, überspringe Injektion.");
        return document.getElementById('onleihe-checker-status');
    }

    const onleiheStatusDiv = document.createElement('div');
    onleiheStatusDiv.id = 'onleihe-checker-status';
    onleiheStatusDiv.className = 'a-section a-spacing-small a-color-secondary'; // Amazon-ähnliche Klassen
    onleiheStatusDiv.style.marginTop = '15px';
    onleiheStatusDiv.style.padding = '10px';
    onleiheStatusDiv.style.border = '1px solid #ccc';
    onleiheStatusDiv.style.borderRadius = '8px';
    onleiheStatusDiv.style.backgroundColor = '#f7f7f7'; // Helles Grau
    onleiheStatusDiv.style.fontFamily = 'Inter, sans-serif'; // Konsistente Schriftart

    onleiheStatusDiv.innerHTML = `
        <div style="display: flex; align-items: center;">
            <div id="onleihe-status-spinner" style="
                border: 4px solid rgba(0, 0, 0, 0.1);
                border-left-color: #2563eb; /* Blau */
                border-radius: 50%;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
                margin-right: 10px;
                display: none; /* Standardmäßig versteckt */
            "></div>
            <p id="onleihe-status-message" style="margin: 0; font-size: 14px; color: #333;">Lade Onleihe-Informationen...</p>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    
    try {
        // Füge das Element ein. Bei body als targetElement wird es an den Anfang des Bodys eingefügt.
        if (targetElement === document.body) {
            targetElement.insertBefore(onleiheStatusDiv, targetElement.firstChild);
        } else {
            targetElement.parentNode.insertBefore(onleiheStatusDiv, targetElement.nextSibling);
        }
        console.log("Onleihe Checker: Statusfeld erfolgreich auf Amazon-Seite eingefügt.");
        return onleiheStatusDiv;
    } catch (e) {
        console.error("Onleihe Checker: FEHLER beim Einfügen des Statusfeldes in den DOM:", e);
        return null;
    }
}

// Funktion zum Aktualisieren des Statusfelds
function updateOnleiheStatus(statusDiv, message, type = 'info', onleiheUrl = null) {
    const spinner = statusDiv.querySelector('#onleihe-status-spinner');
    const msgElement = statusDiv.querySelector('#onleihe-status-message');

    spinner.style.display = 'none'; // Spinner immer ausblenden, es sei denn, es ist 'loading'
    
    statusDiv.style.backgroundColor = '#f7f7f7'; // Standard
    statusDiv.style.borderColor = '#ccc'; // Standard
    statusDiv.style.color = '#333'; // Standard

    if (type === 'loading') {
        spinner.style.display = 'block';
        msgElement.innerHTML = message;
    } else if (type === 'success') {
        statusDiv.style.backgroundColor = '#e6ffe6'; // Grünton
        statusDiv.style.borderColor = '#66cc66';
        statusDiv.style.color = '#1f8b1f'; // Dunkelgrün
        msgElement.innerHTML = `<strong>${message}</strong>`;
        if (onleiheUrl) {
            msgElement.innerHTML += `<br><a href="${onleiheUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">Im Onleihe-Katalog ansehen</a>`;
        }
    } else if (type === 'not_found') {
        statusDiv.style.backgroundColor = '#ffe6e6'; // Rotton
        statusDiv.style.borderColor = '#ff6666';
        statusDiv.style.color = '#cc0000'; // Dunkelrot
        msgElement.innerHTML = `<strong>${message}</strong>`;
        if (onleiheUrl) {
            msgElement.innerHTML += `<br><a href="${onleiheUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">Direkt im Onleihe-Katalog suchen</a>`;
        }
    } else if (type === 'error') {
        statusDiv.style.backgroundColor = '#fff0e6'; // Orangeton
        statusDiv.style.borderColor = '#ff9933';
        statusDiv.style.color = '#e65c00'; // Dunkelorange
        msgElement.innerHTML = `<strong>${message}</strong>`;
    } else { // info oder default
        msgElement.innerHTML = message;
    }
}


// --- Buchinformationen von Amazon-Seite extrahieren ---
function getBookInfoFromAmazon() {
    let isbn = null;
    let title = null;
    let author = null;

    console.log("Content script: Starte Suche nach Buchinformationen auf Amazon.de...");

    // Titel extrahieren und bereinigen
    const titleElement = document.getElementById('productTitle');
    if (titleElement) {
        let fullTitle = titleElement.textContent.trim();
        const separators = [':', '|', '(', '[', '—', ' - '];
        for (const sep of separators) {
            const index = fullTitle.indexOf(sep);
            if (index !== -1) {
                fullTitle = fullTitle.substring(0, index).trim();
            }
        }
        title = fullTitle;
        console.log("Content script: Bereinigter Titel:", title);
    } else {
        const fallbackTitleElement = document.querySelector('h1 span.a-text-bold, h1 span#ebooksProductTitle');
        if (fallbackTitleElement) {
            let fullTitle = fallbackTitleElement.textContent.trim();
            const separators = [':', '|', '(', '[', '—', ' - '];
            for (const sep of separators) {
                const index = fullTitle.indexOf(sep);
                if (index !== -1) {
                    fullTitle = fullTitle.substring(0, index).trim();
                }
            }
            title = fullTitle;
            console.log("Content script: Bereinigter Titel (Fallback):", title);
        } else {
            console.log("Content script: Titel-Element nicht gefunden.");
        }
    }

    // Autor extrahieren (nur Nachname)
    const authorElement = document.querySelector('.author a.a-link-normal, .contributorNameID a.a-link-normal');
    let fullAuthorName = null;

    if (authorElement) {
        fullAuthorName = authorElement.textContent.trim();
    } else {
        const bylineElement = document.getElementById('bylineInfo');
        if (bylineElement) {
            const authorLink = bylineElement.querySelector('a.a-link-normal[data-action="contributor-action"]');
            if (authorLink) {
                fullAuthorName = authorLink.textContent.trim();
            } else {
                const textContent = bylineElement.textContent.trim();
                const match = textContent.match(/(von|By)\s+([A-Za-z\s.]+)/i);
                if (match && match[2]) {
                    fullAuthorName = match[2].trim();
                }
            }
        }
    }

    if (fullAuthorName) {
        const nameParts = fullAuthorName.split(' ');
        if (nameParts.length > 0) {
            author = nameParts[nameParts.length - 1]; // Letztes Wort als Nachname
        } else {
            author = fullAuthorName;
        }
        console.log("Content script: Autor Nachname für Suche:", author);
    } else {
        console.log("Content script: Autor-Element nicht gefunden.");
    }

    // ISBN extrahieren
    const detailLists = document.querySelectorAll(
        '#detailBullets_feature_div .detail-bullet-list, ' +
        '#productDetails_techSpec_section_1 .detail-bullet-list, ' +
        '#productDetailsTable .a-unordered-list'
    );

    for (const ul of detailLists) {
        const listItems = ul.querySelectorAll('li .a-list-item');
        
        for (const item of listItems) {
            const boldTextSpan = item.querySelector('.a-text-bold');
            const valueSpan = boldTextSpan ? boldTextSpan.nextElementSibling : null;

            if (boldTextSpan && valueSpan) {
                const label = boldTextSpan.textContent.trim();
                const value = valueSpan.textContent.trim();
                const cleanLabel = label.replace(/[\r\n\t:]/g, '').trim();

                if (cleanLabel.includes('ISBN-10')) {
                    isbn = value;
                    console.log("Content script: ISBN-10 gefunden:", isbn);
                    break;
                } else if (cleanLabel.includes('ISBN-13')) {
                    // Bevorzugen wir ISBN-10, speichern wir ISBN-13 nur, wenn keine ISBN-10 gefunden wird
                    if (!isbn) {
                       isbn = value;
                       console.log("Content script: ISBN-13 gefunden:", isbn);
                    }
                }
            }
        }
        if (isbn) break;
    }

    if (!isbn) {
        console.log("Content script: ISBN-Element nicht gefunden.");
    }

    return { isbn: isbn, title: title, author: author };
}

// --- Hauptlogik, die beim Laden der Amazon-Seite ausgeführt wird ---
async function runOnleiheCheck() {
    console.log("Onleihe Checker: Content-Skript wird ausgeführt.");

    // Schritt 1: MutationObserver für dynamisch geladene Elemente
    // Wir beobachten den Body auf Hinzufügung von Knoten, die unsere Ziel-Elemente enthalten könnten.
    const observer = new MutationObserver(async (mutations, obs) => {
        // Prüfe, ob eines der Ziel-Elemente jetzt im DOM ist
        const targetElementsExist = document.getElementById('productTitle') ||
                                   document.getElementById('detailBulletsWrapper_feature_div') ||
                                   document.getElementById('dp-container');

        if (targetElementsExist) {
            obs.disconnect(); // Beobachtung beenden, sobald ein Ziel gefunden wurde
            console.log("Onleihe Checker: Ziel-Element für Injektion per MutationObserver gefunden.");
            
            const statusField = injectOnleiheStatusField();
            if (!statusField) {
                console.error("Onleihe Checker: Statusfeld konnte nicht eingefügt werden, Abbruch der Prüfung.");
                return; // Kann nicht fortfahren, wenn kein Feld eingefügt werden kann
            }

            // Der Rest der Logik, sobald das Statusfeld eingefügt ist
            const result = await chrome.storage.local.get(['selectedOnleiheLibraryURL', 'selectedOnleiheLibraryName']);
            const selectedLibraryBaseURL = result.selectedOnleiheLibraryURL;
            const selectedLibraryName = result.selectedLibraryName;

            if (!selectedLibraryBaseURL) {
                updateOnleiheStatus(statusField, 'Bitte wähle deine Onleihe-Bibliothek im Plugin-Popup aus.', 'warning');
                return;
            }
            updateOnleiheStatus(statusField, `Prüfe Verfügbarkeit in "${selectedLibraryName}"...`, 'loading');

            const bookInfo = getBookInfoFromAmazon();
            const amazonIsbn = bookInfo.isbn;
            const amazonTitle = bookInfo.title;
            const amazonAuthor = bookInfo.author;

            let searchTerm = '';
            if (amazonTitle && amazonTitle !== 'Nicht gefunden') {
                searchTerm = amazonTitle;
                if (amazonAuthor && amazonAuthor !== 'Nicht gefunden') {
                    searchTerm = `${amazonTitle} ${amazonAuthor}`;
                }
            } else if (amazonIsbn && amazonIsbn !== 'Nicht gefunden') {
                searchTerm = amazonIsbn;
            } else {
                updateOnleiheStatus(statusField, 'Keine Buchinformationen (Titel, Autor oder ISBN) von Amazon gefunden.', 'not_found');
                return;
            }

            const onleiheSearchURL = `${selectedLibraryBaseURL}/frontend/search,0-0-0-0-0-0-0-0-0-0-0.html?cmdId=703&sK=1000&pText=${encodeURIComponent(searchTerm)}&pMediaType=400001&Suchen=Suchen`;

            console.log(`Onleihe Checker: Sende Suchanfrage an Service Worker für URL: ${onleiheSearchURL}`);
            
            try {
                const responseFromBackground = await chrome.runtime.sendMessage({ 
                    action: "fetch_onleihe_results", 
                    url: onleiheSearchURL 
                });

                if (responseFromBackground && responseFromBackground.success) {
                    const count = responseFromBackground.count;
                    if (count > 0) {
                        updateOnleiheStatus(statusField, `Im Onleihe-Katalog "${selectedLibraryName}" ${count} Treffer gefunden!`, 'success', onleiheSearchURL);
                    } else {
                        updateOnleiheStatus(statusField, `Keine Treffer im Onleihe-Katalog "${selectedLibraryName}" gefunden.`, 'not_found', onleiheSearchURL);
                    }
                } else {
                    updateOnleiheStatus(statusField, `Fehler beim Abruf der Onleihe-Daten: ${responseFromBackground.error || 'Unbekannter Fehler'}`, 'error');
                }
            } catch (error) {
                console.error("Onleihe Checker: Fehler bei der Kommunikation mit dem Service Worker:", error);
                updateOnleiheStatus(statusField, `Kommunikationsfehler: ${error.message}`, 'error');
            }
        }
    });

    // Beginne die Beobachtung des gesamten Dokuments (oder eines spezifischeren Containers)
    // Wir beobachten Änderungen an den Kindknoten und allen Nachkommen.
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
        console.log("Onleihe Checker: MutationObserver auf document.body gestartet.");
    } else {
        console.error("Onleihe Checker: document.body nicht verfügbar, kann MutationObserver nicht starten.");
        // Fallback: Direkter Versuch nach kurzem Timeout, falls Body später geladen wird
        setTimeout(() => {
            const statusField = injectOnleiheStatusField();
            if (statusField) {
                 updateOnleiheStatus(statusField, 'Plugin-Elemente nach kurzer Verzögerung eingefügt. Prüfe Onleihe...', 'loading');
                 // Re-run the core logic if elements successfully inserted as a fallback
                 runOnleiheCheckCore(); // Call a separate function for the main logic
             } else {
                console.warn("Onleihe Checker: Statusfeld konnte auch nach kurzem Timeout nicht eingefügt werden (document.body nicht verfügbar).");
             }
        }, 500); // Kurze Verzögerung für body
    }


    // Fallback-Timeout für den Fall, dass die Elemente nie erscheinen (oder der Observer aus irgendeinem Grund nicht triggert)
    // Dieser Timeout dient als Sicherheitsnetz und meldet, wenn die Initialisierung nach 10 Sekunden nicht erfolgreich war.
    setTimeout(() => {
        if (observer && typeof observer.disconnect === 'function') {
            observer.disconnect();
            console.log("Onleihe Checker: MutationObserver nach Timeout getrennt.");
        }
        
        const existingStatusField = document.getElementById('onleihe-checker-status');
        if (!existingStatusField) {
             console.log("Onleihe Checker: Timeout erreicht, Statusfeld noch nicht eingefügt. Versuch einer letzten Injektion...");
             const finalStatusField = injectOnleiheStatusField(); // Letzter Versuch, das Feld einzufügen
             if (finalStatusField) {
                 console.warn("Onleihe Checker: Feld nach 10s Timeout eingefügt, aber möglicherweise zu spät für automatische Prüfung. Bitte prüfe manuell.");
                 updateOnleiheStatus(finalStatusField, 'Seite lädt zu lange oder benötigte Elemente nicht gefunden (nach Timeout).', 'error');
             } else {
                 console.error("Onleihe Checker: Statusfeld konnte nach 10s Timeout nicht eingefügt werden. Abbruch.");
             }
        }
    }, 10000); // 10 Sekunden Timeout für den Observer (falls er nicht triggert)

}

// Separate Funktion für die Kernlogik, damit sie bei Fallback erneut aufgerufen werden kann
async function runOnleiheCheckCore() {
    console.log("Onleihe Checker: Kernprüfung wird ausgeführt.");
    const statusField = document.getElementById('onleihe-checker-status'); // Annahme, dass es jetzt existiert

    if (!statusField) {
        console.error("Onleihe Checker: runOnleiheCheckCore aufgerufen, aber Statusfeld nicht gefunden.");
        return;
    }

    const result = await chrome.storage.local.get(['selectedOnleiheLibraryURL', 'selectedOnleiheLibraryName']);
    const selectedLibraryBaseURL = result.selectedOnleiheLibraryURL;
    const selectedLibraryName = result.selectedLibraryName;

    if (!selectedLibraryBaseURL) {
        updateOnleiheStatus(statusField, 'Bitte wähle deine Onleihe-Bibliothek im Plugin-Popup aus.', 'warning');
        return;
    }
    updateOnleiheStatus(statusField, `Prüfe Verfügbarkeit in "${selectedLibraryName}"...`, 'loading');

    const bookInfo = getBookInfoFromAmazon();
    const amazonIsbn = bookInfo.isbn;
    const amazonTitle = bookInfo.title;
    const amazonAuthor = bookInfo.author;

    let searchTerm = '';
    if (amazonTitle && amazonTitle !== 'Nicht gefunden') {
        searchTerm = amazonTitle;
        if (amazonAuthor && amazonAuthor !== 'Nicht gefunden') {
            searchTerm = `${amazonTitle} ${amazonAuthor}`;
        }
    } else if (amazonIsbn && amazonIsbn !== 'Nicht gefunden') {
        searchTerm = amazonIsbn;
    } else {
        updateOnleiheStatus(statusField, 'Keine Buchinformationen (Titel, Autor oder ISBN) von Amazon gefunden.', 'not_found');
        return;
    }

    const onleiheSearchURL = `${selectedLibraryBaseURL}/frontend/search,0-0-0-0-0-0-0-0-0-0-0.html?cmdId=703&sK=1000&pText=${encodeURIComponent(searchTerm)}&pMediaType=400001&Suchen=Suchen`;

    console.log(`Onleihe Checker: Sende Suchanfrage an Service Worker für URL: ${onleiheSearchURL}`);
    
    try {
        const responseFromBackground = await chrome.runtime.sendMessage({ 
            action: "fetch_onleihe_results", 
            url: onleiheSearchURL 
        });

        if (responseFromBackground && responseFromBackground.success) {
            const count = responseFromBackground.count;
            if (count > 0) {
                updateOnleiheStatus(statusField, `Im Onleihe-Katalog "${selectedLibraryName}" ${count} Treffer gefunden!`, 'success', onleiheSearchURL);
            } else {
                updateOnleiheStatus(statusField, `Keine Treffer im Onleihe-Katalog "${selectedLibraryName}" gefunden.`, 'not_found', onleiheSearchURL);
            }
        } else {
            updateOnleiheStatus(statusField, `Fehler beim Abruf der Onleihe-Daten: ${responseFromBackground.error || 'Unbekannter Fehler'}`, 'error');
        }
    } catch (error) {
        console.error("Onleihe Checker: Fehler bei der Kommunikation mit dem Service Worker:", error);
        updateOnleiheStatus(statusField, `Kommunikationsfehler: ${error.message}`, 'error');
    }
}


// Führe die Hauptlogik aus, sobald das DOM geladen ist
// Wir nutzen DOMContentLoaded, um sicherzustellen, dass die Amazon-Seite initial bereit ist.
// Der MutationObserver kümmert sich um dynamische Inhalte.
document.addEventListener('DOMContentLoaded', runOnleiheCheck);
