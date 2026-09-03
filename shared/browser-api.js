// browser-api.js. Picks the promise-based extension namespace
self.OnleiheBrowser = typeof browser !== 'undefined' && browser?.runtime ? browser : chrome;
