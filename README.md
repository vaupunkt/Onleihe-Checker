# Onleihe Checker

![OnleiheChecker - PopUp Window](assets/174_1x_shots_so.png)

Browser extension for Chrome and Firefox: while you browse **Amazon.de** and **Goodreads**, it
shows right on the book page whether the title is available in your **Onleihe** (the German public
libraries' ebook lending service).

Not just *whether* the catalogue holds it — but whether it is **available to borrow right now** or
**on loan and reservable**.

## Installation

| Browser | Store |
|---|---|
| Chrome | [Chrome Web Store](https://chromewebstore.google.com/detail/onleihe-checker/lbdbelkkmbogfjkeklmpfaijgpdnnncn?hl=de) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/de/firefox/addon/onleihechecker/) |

After installing, click the icon once, search for your own library and save it. There are **2232
libraries** to pick from, across Germany, Austria, Switzerland and Luxembourg.

## How it works

```
Amazon / Goodreads book page
        │  read title + author
        ▼
content.js ──► background.js ──► api.onleihe.de
        │                          guest token + search
        ◄──────────────────────────┘
        │  hits + availability
        ▼
   status field on the page
```

The extension uses the JSON API of Onleihe 3.0. A **guest token** is enough — **no library account
and no sign-in** is required, and no credentials are processed.

Endpoints used:

| Purpose | Call |
|---|---|
| Guest token | `POST /user-application/v1/auth/login` with `{onleiheId, libraryId}` |
| Search | `POST /ui/v1/onleihe/{onleiheId}/search?libraryId=…` |
| Library directory (build only) | `GET /user-application/v2/auth/libraries` |

`onleiheId` and `libraryId` have to match between the token and the search request — a token minted
without `libraryId` whose `?libraryId=` is then sent along with the search is rejected with `401`.

## Permissions

Deliberately kept minimal:

| Permission | What for |
|---|---|
| `storage` | remember the selected library and language locally |
| `https://api.onleihe.de/*` | the availability lookup |
| `https://*.amazon.de/*`, `https://*.goodreads.com/*` | read book data on the page and insert the status field |

The content script runs **only on book pages** (`/dp/`, `/gp/product/`, `/book/show/`), not on every
page of those domains. No data is sent to anyone other than Onleihe; what is transmitted is only the
search term built from title and author.

## Development

```bash
npm install
npm run build          # -> dist/chrome/, dist/firefox/ + archives
npm test               # unit and DOM integration tests
npm run smoke          # checks the real Onleihe API (every consortium; --sample N for fewer)
npm run lint:firefox   # web-ext lint
```

Loading it for testing: in Chrome, `chrome://extensions` → *Load unpacked* → `dist/chrome`. In
Firefox, `npx web-ext run --source-dir dist/firefox`.

### Layout

```
shared/       source shared by both builds
  browser-api.js   picks the promise-based namespace (chrome.* / browser.*)
  i18n.js          translations, DE/EN, switchable at runtime
  onleihe-api.js   access to the Onleihe 3.0 API
  background.js    relays the lookup
  content.js       reads the book page, shows the status field
  popup.js/.html   library selection
  libraries.json   generated, do not edit by hand
platform/     manifest.chrome.json (MV3), manifest.firefox.json (MV3)
tools/        build, data generation, tests
dist/         build output (not checked in)
```

Chrome and Firefox share the same code; only the manifests differ. So always change `shared/` —
never `dist/`.

Always reach the extension APIs through `OnleiheBrowser`, never through `chrome.*` or `browser.*`
directly: in Firefox `chrome.*` is callback-based, and awaiting it silently yields `undefined`.

### Updating the library data

```bash
npm run libraries      # python3 tools/build_libraries.py
```

Fetches the directory from the API, discards the operator's internal test tenants, and maps each
consortium to its catalogue host (for the "show in catalogue" link). The host cannot be resolved
backwards from the `onleiheId`, so the script follows the redirects of the old Onleihe 2.x addresses
in `tools/legacy_base_urls.json` and adds candidates derived from library and city names. Consortia
without a known host still work — only the deep link is omitted.

### Bumping the version

The version lives in `platform/manifest.chrome.json`, `platform/manifest.firefox.json` and
`package.json`. `tools/build.sh` derives the archive names from it.

## Troubleshooting

| Symptom | Cause |
|---|---|
| No status field on an Amazon page | Not recognised as a book page. To diagnose, paste `tools/diagnose-page.js` into the browser console — it reports what is missing, signal by signal. |
| "Bitte wähle deine Onleihe-Bibliothek" | No library saved in the popup yet. |
| "Nicht im Onleihe-Katalog vorhanden" | A genuine gap in the catalogue, not a failure. Smaller consortia do not carry many titles. |
| "Onleihe-Abfrage fehlgeschlagen" | An API problem — the status code is in the message. `npm run smoke` checks every consortium. |
| No "show in catalogue" link | No host is known for that consortium; the availability check itself still works. |

The user-facing strings are German and English; the table above quotes the German ones.

## Licence

MIT

## Disclaimer

An independent project, neither endorsed nor reviewed by divibib GmbH, Amazon or Goodreads.
"Onleihe" is a trademark of divibib GmbH.
