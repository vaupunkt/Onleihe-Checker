function getBrowserLanguage() {
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
        return htmlLang.startsWith('en') ? 'en' : 'de';
    }
    
    const url = window.location.href;
    if (url.includes('.com') || url.includes('/en/') || url.includes('lang=en')) {
        return 'en';
    }
    if (url.includes('.de') || url.includes('/de/') || url.includes('lang=de')) {
        return 'de';
    }
    
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
    let text = translations[currentLanguage][key] || translations['en'][key] || key;
    
    args.forEach((arg, index) => {
        text = text.replace(`{${index}}`, arg);
    });
    
    return text;
}

if (typeof window !== 'undefined') {
    window.t = t;
    window.getBrowserLanguage = getBrowserLanguage;
    window.getCurrentLanguage = getCurrentLanguage;
    window.setLanguage = setLanguage;
    
    setTimeout(() => {
        if (typeof window.t === 'function') {
            const event = new CustomEvent('onleiheLocalesReady');
            window.dispatchEvent(event);
        } else {
            console.error('Onleihe locales: Functions not properly registered');
        }
    }, 10);
}