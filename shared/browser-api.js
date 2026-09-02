// browser-api.js - wählt den Promise-basierten Erweiterungs-Namespace.
//
// Chrome kennt nur `chrome.*` und liefert dort ab MV3 Promises.
// Firefox kennt beides: `browser.*` ist Promise-basiert, `chrome.*` erwartet
// Callbacks. Ein `await chrome.storage.local.get(...)` liefert in Firefox
// deshalb undefined, ohne einen Fehler zu werfen - genau daran scheiterte im
// alten Firefox-Build das Wiederherstellen der gespeicherten Bibliothek.
//
// Immer über OnleiheBrowser gehen, nie direkt chrome.* oder browser.* nutzen.

self.OnleiheBrowser = typeof browser !== 'undefined' && browser?.runtime ? browser : chrome;
