(() => {
    'use strict';

    const MESSAGES = {
        de: {
            'popup.title': '📚 Onleihe Checker',
            'popup.language.label': '🌐 Sprache:',
            'popup.language.changed': 'Sprache wurde geändert.',
            'popup.search.info': 'Suche und wähle deine Bibliothek aus.',
            'popup.search.label': '🔍 Bibliothek suchen & auswählen:',
            'popup.search.placeholder': 'Bibliothek oder Ort suchen...',
            'popup.save.button': '💾 Bibliothek speichern',
            'popup.sites.info': '🌐 Öffne eine Amazon.de- oder Goodreads-Buchseite für die Verfügbarkeitsprüfung.',
            'popup.no.libraries': 'Keine Bibliotheken gefunden',
            'popup.please.select': 'Bitte wähle deine Bibliothek aus.',
            'popup.library.saved': '"{0}" wurde als Standardbibliothek gespeichert.',
            'popup.current.library': 'Deine Standardbibliothek ist: {0}',
            'popup.error.loading': 'Fehler beim Laden der Bibliotheken.',
            'popup.error.select': 'Bitte wähle eine Bibliothek aus.',

            'content.loading': 'Lade Onleihe-Informationen...',
            'content.checking': 'Prüfe Verfügbarkeit in "{0}"...',
            'content.please.select.library': 'Bitte wähle deine Onleihe-Bibliothek in der Erweiterung aus.',
            'content.no.book.info': 'Keine Buchinformationen (Titel, Autor oder ISBN) gefunden.',
            'content.available': 'Sofort ausleihbar in "{1}" ({0} Treffer)',
            'content.all.lent': 'Alle {0} Exemplare in "{1}" verliehen - vormerkbar',
            'content.no.results': 'Nicht im Onleihe-Katalog "{0}" vorhanden.',
            'content.view.catalog': 'Im Onleihe-Katalog anzeigen',
            'content.search.directly': 'Direkt im Onleihe-Katalog suchen',
            'content.error.retrieving': 'Onleihe-Abfrage fehlgeschlagen: {0}',
            'content.error.unknown': 'Unbekannter Fehler',
            'content.error.no.response': 'Keine Antwort von der Erweiterung erhalten',
            'content.error.timeout': 'Zeitüberschreitung bei der Onleihe-Anfrage',
            'content.error.http': 'Onleihe antwortete mit Status {0}',

            'media.E_BOOK': 'E-Book',
            'media.E_AUDIO': 'Hörbuch',
            'media.E_PAPER': 'E-Paper',
            'media.E_MAGAZINE': 'E-Magazin',
            'media.E_VIDEO': 'Video',
            'media.E_MUSIC': 'Musik',
            'media.E_LEARNING': 'E-Learning'
        },
        en: {
            'popup.title': '📚 Onleihe Checker',
            'popup.language.label': '🌐 Language:',
            'popup.language.changed': 'Language has been changed.',
            'popup.search.info': 'Search and select your library.',
            'popup.search.label': '🔍 Search & select library:',
            'popup.search.placeholder': 'Search library or city...',
            'popup.save.button': '💾 Save library',
            'popup.sites.info': '🌐 Open an Amazon.de or Goodreads book page to check availability.',
            'popup.no.libraries': 'No libraries found',
            'popup.please.select': 'Please select your library.',
            'popup.library.saved': '"{0}" has been saved as your default library.',
            'popup.current.library': 'Your default library is: {0}',
            'popup.error.loading': 'Error loading libraries.',
            'popup.error.select': 'Please select a library.',

            'content.loading': 'Loading Onleihe information...',
            'content.checking': 'Checking availability in "{0}"...',
            'content.please.select.library': 'Please select your Onleihe library in the extension popup.',
            'content.no.book.info': 'No book information (title, author or ISBN) found.',
            'content.available': 'Available now in "{1}" ({0} results)',
            'content.all.lent': 'All {0} copies in "{1}" are on loan - can be reserved',
            'content.no.results': 'Not available in Onleihe catalog "{0}".',
            'content.view.catalog': 'View in Onleihe catalog',
            'content.search.directly': 'Search directly in Onleihe catalog',
            'content.error.retrieving': 'Onleihe request failed: {0}',
            'content.error.unknown': 'Unknown error',
            'content.error.no.response': 'No response received from the extension',
            'content.error.timeout': 'Onleihe request timed out',
            'content.error.http': 'Onleihe responded with status {0}',

            'media.E_BOOK': 'eBook',
            'media.E_AUDIO': 'Audiobook',
            'media.E_PAPER': 'ePaper',
            'media.E_MAGAZINE': 'eMagazine',
            'media.E_VIDEO': 'Video',
            'media.E_MUSIC': 'Music',
            'media.E_LEARNING': 'eLearning'
        }
    };

    const DEFAULT_LANGUAGE = 'de';
    let currentLanguage = DEFAULT_LANGUAGE;

    function isSupported(lang) {
        return Object.prototype.hasOwnProperty.call(MESSAGES, lang);
    }

    function detectLanguage() {
        const browserLang = (navigator.language || DEFAULT_LANGUAGE).slice(0, 2);
        return isSupported(browserLang) ? browserLang : DEFAULT_LANGUAGE;
    }

    function setLanguage(lang) {
        if (isSupported(lang)) {
            currentLanguage = lang;
            return true;
        }
        return false;
    }

    function getCurrentLanguage() {
        return currentLanguage;
    }

    function t(key, ...args) {
        const table = MESSAGES[currentLanguage] || MESSAGES[DEFAULT_LANGUAGE];
        let text = table[key] ?? MESSAGES[DEFAULT_LANGUAGE][key] ?? key;
        args.forEach((arg, index) => {
            text = text.replaceAll(`{${index}}`, String(arg));
        });
        return text;
    }

    self.OnleiheI18n = { t, setLanguage, getCurrentLanguage, detectLanguage, isSupported };
})();
