// Prevent multiple loading of this script
if (typeof window.OnleiheLocalesLoaded !== 'undefined') {
    // Already loaded, exit early
    console.log('Onleihe locales already loaded');
} else {
    console.log('Onleihe locales: Starting initialization...');
    
    // Set loading flag immediately
    window.OnleiheLocalesLoaded = true;

    const translations = {
        de: {
            // Popup translations
            'popup.title': 'Onleihe Checker',
            'popup.language.label': 'Sprache:',
            'popup.language.changed': 'Sprache wurde geändert.',
            'popup.search.info': 'Suche und wähle deine Bibliothek aus.',
            'popup.search.label': '🔍 Bibliothek suchen & auswählen:',
            'popup.search.placeholder': 'Bibliothek suchen...',
            'popup.save.button': '💾 Bibliothek speichern',
            'popup.amazon.info': '🌐 Öffne eine Amazon.de Buchseite für die Verfügbarkeitsprüfung.',
            'popup.no.libraries': 'Keine Bibliotheken gefunden',
            'popup.please.select': 'Bitte wähle deine Bibliothek aus.',
            'popup.library.saved': '"{0}" wurde als Standardbibliothek gespeichert.',
            'popup.current.library': 'Deine Standardbibliothek ist: {0}',
            'popup.error.loading': 'Fehler beim Laden der Bibliotheken.',
            'popup.error.select': 'Bitte wähle eine Bibliothek aus.',
            
            // Content script translations
            'content.loading': 'Lade Onleihe-Informationen...',
            'content.checking': 'Prüfe Verfügbarkeit in "{0}"...',
            'content.please.select.library': 'Bitte wähle deine Onleihe-Bibliothek in der Erweiterung aus.',
            'content.no.book.info': 'Keine Buchinformationen (Titel, Autor oder ISBN) gefunden.',
            'content.found.results': '{0} Ergebnisse im Onleihe-Katalog "{1}" gefunden!',
            'content.no.results': 'Keine Ergebnisse im Onleihe-Katalog "{0}" gefunden.',
            'content.view.catalog': 'Im Onleihe-Katalog anzeigen',
            'content.search.directly': 'Direkt im Onleihe-Katalog suchen',
            'content.error.retrieving': 'Fehler beim Abrufen der Onleihe-Daten: {0}',
            'content.communication.error': 'Kommunikationsfehler: {0}',
            
            // Countries
            'country.de': 'Deutschland',
            'country.at': 'Österreich',
            'country.ch': 'Schweiz',
            'country.be': 'Belgien',
            'country.fr': 'Frankreich',
            'country.it': 'Italien',
            'country.lu': 'Luxemburg',
            'country.li': 'Liechtenstein',
            'country.other': 'Sonstige (Goethe-Institut, WDA)',
            'country.unknown': 'Unbekanntes Land'
        },
        en: {
            // Popup translations
            'popup.title': 'Onleihe Checker',
            'popup.language.label': 'Language:',
            'popup.language.changed': 'Language has been changed.',
            'popup.search.info': 'Search and select your library.',
            'popup.search.label': '🔍 Search & select library:',
            'popup.search.placeholder': 'Search library...',
            'popup.save.button': '💾 Save library',
            'popup.amazon.info': '🌐 Open an Amazon.de book page to check availability.',
            'popup.no.libraries': 'No libraries found',
            'popup.please.select': 'Please select your library.',
            'popup.library.saved': '"{0}" has been saved as default library.',
            'popup.current.library': 'Your default library is: {0}',
            'popup.error.loading': 'Error loading libraries.',
            'popup.error.select': 'Please select a library.',
            
            // Content script translations
            'content.loading': 'Loading Onleihe information...',
            'content.checking': 'Checking availability in "{0}"...',
            'content.please.select.library': 'Please select your Onleihe library in the extension popup.',
            'content.no.book.info': 'No book information (title, author or ISBN) found.',
            'content.found.results': 'Found {0} results in Onleihe catalog "{1}"!',
            'content.no.results': 'No results found in Onleihe catalog "{0}".',
            'content.view.catalog': 'View in Onleihe catalog',
            'content.search.directly': 'Search directly in Onleihe catalog',
            'content.error.retrieving': 'Error retrieving Onleihe data: {0}',
            'content.communication.error': 'Communication error: {0}',
            
            // Countries
            'country.de': 'Germany',
            'country.at': 'Austria',
            'country.ch': 'Switzerland',
            'country.be': 'Belgium',
            'country.fr': 'France',
            'country.it': 'Italy',
            'country.lu': 'Luxembourg',
            'country.li': 'Liechtenstein',
            'country.other': 'Other (Goethe Institute, WDA)',
            'country.unknown': 'Unknown Country'
        }
    };

    // Current language state
    let currentLanguage = 'de'; // Default to German

    function getBrowserLanguage() {
        // First try to get language from page locale
        const htmlLang = document.documentElement.lang;
        if (htmlLang) {
            return htmlLang.startsWith('en') ? 'en' : 'de';
        }
        
        // Fallback: check URL for language indicators
        const url = window.location.href;
        if (url.includes('.com') || url.includes('/en/') || url.includes('lang=en')) {
            return 'en';
        }
        if (url.includes('.de') || url.includes('/de/') || url.includes('lang=de')) {
            return 'de';
        }
        
        // Final fallback: use browser language
        const browserLang = navigator.language || navigator.userLanguage;
        return browserLang.startsWith('en') ? 'en' : 'de';
    }

    function getCurrentLanguage() {
        return currentLanguage;
    }

    function setLanguage(lang) {
        if (translations[lang]) {
            currentLanguage = lang;
        }
    }

    function t(key, ...args) {
        let text = translations[currentLanguage][key] || translations['de'][key] || key;
        
        // Replace placeholders {0}, {1}, etc. with arguments
        args.forEach((arg, index) => {
            text = text.replace(`{${index}}`, arg);
        });
        
        return text;
    }

    // Make functions available globally
    if (typeof window !== 'undefined') {
        window.t = t;
        window.getBrowserLanguage = getBrowserLanguage;
        window.getCurrentLanguage = getCurrentLanguage;
        window.setLanguage = setLanguage;
                
        // Ensure functions are available before dispatching event
        setTimeout(() => {
            if (typeof window.t === 'function') {
                const event = new CustomEvent('onleiheLocalesReady');
                window.dispatchEvent(event);
            } else {
                console.error('Onleihe locales: Functions not properly registered');
            }
        }, 10);
    }
}
