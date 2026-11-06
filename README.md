# Onleihe Checker

> ## ⛔ Project discontinued
>
> **Onleihe Checker is no longer developed.** When asked, Onleihe (divibib) explicitly **did not
> consent** to this extension using its interface. In addition, all Onleihe libraries are moving to
> **Libby** over the coming year.
>
> The final version (1.3) no longer sends any requests to Onleihe servers, deletes stored settings
> and only shows a notice. The extension will then be removed from the Chrome Web Store and
> addons.mozilla.org.
>
> **Please do not use this code to access Onleihe or divibib interfaces or websites without their
> consent.** Older states in the Git history are kept for documentation purposes only.
>
> Thanks to everyone who used the extension!

---

## What was this?

A browser extension for Chrome and Firefox that showed, on Amazon.de and Goodreads book pages,
whether a title was available in your Onleihe library.

## Current state (version 1.3, sunset release)

- No content scripts and no network requests
- Only permission: `storage` (used solely to delete the old settings)
- On update, `storage.local` and `storage.sync` are cleared and a notice page opens once, with an
  "Erweiterung entfernen" (remove extension) button

## Layout

```
OnleiheChecker/          Chrome (Manifest V3)
OnleiheChecker_firefox/  Firefox (Manifest V2)
tools/build.sh           builds release/*.zip for both stores
tests/verify.sh          checks permissions, files and that no Onleihe URLs are included
```

Build and verify (requires `jq`, `zip` and `node`):

```bash
tools/build.sh
```
