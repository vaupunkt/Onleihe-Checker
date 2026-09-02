// browser-api.js. Wählt den Promise-basierten Erweiterungs-Namespace
self.OnleiheBrowser = typeof browser !== 'undefined' && browser?.runtime ? browser : chrome;
