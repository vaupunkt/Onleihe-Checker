# Chrome Extension Permissions Documentation

This document explains why each permission in the Onleihe Checker Chrome extension is necessary for proper functionality.

## Required Permissions

### `storage`
**Purpose**: Store user preferences and library selection
**Usage**: 
- Save selected Onleihe library (URL and name)
- Store language preference (German/English)
- Remember user settings between browser sessions

### `activeTab`
**Purpose**: Access the currently active Amazon.de tab
**Usage**:
- Read book information (title, author, ISBN) from Amazon product pages
- Inject the Onleihe availability status widget
- Modify page content to show search results

### `tabs`
**Purpose**: Query and message tabs for language synchronization
**Usage**:
- Send language change notifications to all Amazon tabs when user changes language in popup
- Query open tabs to update language settings across multiple Amazon pages
- Required for cross-tab communication

### `scripting`
**Purpose**: Execute scripts in web pages for content fetching
**Usage**:
- Execute scripts in background tabs to fetch Onleihe search results
- Extract HTML content from Onleihe library websites
- Bypass CORS restrictions when fetching library data

## Host Permissions

### Amazon Domains
```
"https://www.amazon.de/*"
"https://amazon.de/*"
```
**Purpose**: Access Amazon.de product pages
**Usage**:
- Extract book metadata (title, author, ISBN)
- Inject availability status widget
- Monitor page navigation for single-page app behavior

### Generic Onleihe Domains
```
"https://*.onleihe.de/*"
"https://*.onleihe.net/*"
"https://*.onleihe.ch/*"
"https://*.onleihe.at/*"
"https://*.onleihe.be/*"
"https://*.onleihe.fr/*"
"https://*.onleihe.it/*"
"https://*.onleihe.lu/*"
"https://*.onleihe.li/*"
```
**Purpose**: Access international Onleihe platforms
**Usage**:
- Fetch search results from various country-specific Onleihe instances
- Support libraries across German-speaking countries and international locations

### Specific Library Domains
```
"https://www.ostalb-onleihe.de/*"
"https://ostalb.onleihe.de/*"
"https://www.metropolbib.de/*"
"https://www.franken-onleihe.de/*"
"https://www.leo-sued.de/*"
"https://www.leo-nord.de/*"
"https://www.enio24.de/*"
"https://www.digibobb.de/*"
"https://www.biblioload.de/*"
"https://www.biblioplus-digital.de/*"
"https://www.e-medien-franken.de/*"
"https://www.e-ausleihe-franken.de/*"
"https://www.emedienbayern.de/*"
"https://www.ebook.baden.ch/*"
"https://www.elbe-elster-bibnet.de/*"
"https://hessen.onleihe.de/*"
"https://voebb.onleihe.de/*"
"https://oberlausitz.onleihe.de/*"
"https://www.onleihe-oberlausitz.de/*"
```
**Purpose**: Access specific German library systems with custom domains
**Usage**:
- Support regional library networks that use custom domain names
- Fetch availability data from specialized library platforms
- Handle URL redirects and alternative domain configurations

### HTTP Fallback
```
"http://*.onleihe.de/*"
"http://*.onleihe.net/*"
```
**Purpose**: Support older library systems that may still use HTTP
**Usage**:
- Ensure compatibility with legacy library installations
- Handle mixed HTTPS/HTTP configurations
- Provide fallback for libraries not yet migrated to HTTPS

## Web Accessible Resources

### `libraries.json`
**Purpose**: Library database accessible to content scripts
**Usage**:
- Provide library information to popup interface
- Enable library search and selection functionality

### `locales.js`
**Purpose**: Translation system for multilingual support
**Usage**:
- Load German and English translations
- Support dynamic language switching
- Provide localized user interface

## Privacy Considerations

- **No data collection**: Extension only accesses data locally for functionality
- **No external servers**: All processing happens locally in the browser
- **Limited scope**: Permissions are restricted to necessary domains only
- **User control**: Users can see exactly which libraries the extension contacts
- **Transparent operation**: All network requests are for fetching public library data

## Security Measures

- **Minimal permissions**: Only requests permissions absolutely necessary for functionality
- **Specific domains**: Uses specific domain patterns rather than broad wildcards where possible
- **Local processing**: Book information extraction happens locally without sending data to external servers
- **No persistent background**: Service worker only activates when needed

## Permission Alternatives Considered

### Why not `<all_urls>`?
- Too broad and unnecessary
- Would require additional privacy disclosures
- Specific domain permissions provide better security

### Why not just `activeTab`?
- Need to access multiple Onleihe domains for search functionality
- Background script needs to fetch from library websites
- Cross-tab language synchronization requires `tabs` permission

### Why `scripting` instead of content scripts only?
- Dynamic content fetching requires script execution in background tabs
- CORS bypass mechanism needs programmatic script injection
- More flexible than pre-defined content script matches
