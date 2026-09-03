# Onleihe Scraper & Checker

> ## ⚠️ Currently not working — a rewrite is in progress
>
> Onleihe has migrated to **Onleihe 3.0**, a client-side rendered web app. Its search page no
> longer ships the results in the HTML, so the extension cannot read them and reports
> **"no results found" for every library**. The published **version 1.2** in both stores is
> affected.
>
> **A rewrite against the Onleihe 3.0 JSON API is under way** 
>
> Everything below describes version 1.2 and is kept for reference. Until the new version ships,
> please search the Onleihe catalogue directly.

![OnleiheChecker - PopUp Window](assets/174_1x_shots_so.png)

A Python web scraper and Chrome extension for German digital library services (Onleihe). This project consists of two main components:

1. **Web Scraper**: Extracts library information from official Onleihe help pages
2. **Chrome Extension**: Checks book availability in your local Onleihe library while browsing Amazon.de and Goodreads

## 🚀 Quick Start

> **Note:** the store builds below are version 1.2 and do not work at the moment — see the notice
> at the top.

### Chrome Extension (Recommended)
**[📥 Install from Chrome Web Store](https://chromewebstore.google.com/detail/onleihe-checker/lbdbelkkmbogfjkeklmpfaijgpdnnncn?hl=de)**

*The easiest way to get started - install directly from the Chrome Web Store with automatic updates.*

### Firefox Add-on (Recommended)
**[📥 Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/onleihechecker/)**

*Also available for Firefox users - install directly from Mozilla Add-ons with automatic updates.*

### Manual Installation (Developers)
For development or manual installation, see [Installation Guide](#-installation) below.

## 📚 Table of Contents
- [🚀 Features](#-features)
    - [Web Scraper](#web-scraper)
    - [Chrome Extension](#chrome-extension)
- [📋 Requirements](#-requirements)
    - [For Web Scraping](#for-web-scraping)
    - [For Chrome Extension](#for-chrome-extension)
- [🛠 Installation](#-installation)
    - [1. Web Scraper Setup](#1-web-scraper-setup)
    - [2. Chrome Extension Setup](#2-chrome-extension-setup)
- [🎯 Usage](#-usage)
    - [Web Scraping](#web-scraping)
    - [Chrome Extension](#chrome-extension-1)
- [📁 Project Structure](#-project-structure)
- [🔧 Configuration](#-configuration)
    - [Scraper Settings](#scraper-settings)
    - [Extension Settings](#extension-settings)
- [🌍 Supported Libraries](#-supported-libraries)
    - [Web Scraper Coverage](#web-scraper-coverage)
    - [Chrome Extension Support](#chrome-extension-support)
- [🐛 Troubleshooting](#-troubleshooting)
    - [Common Scraping Issues](#common-scraping-issues)
    - [Extension Issues](#extension-issues)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)
- [⚠️ Disclaimer](#️-disclaimer)
- [🔄 Maintenance](#-maintenance)
    - [Updating Library Data](#updating-library-data)
- [🔒 Security & Permissions](#-security--permissions)

## 🚀 Features

### Web Scraper
> **Broken:** the help page this reads was removed and now returns 404. The rewrite replaces the
> scraper with the official directory endpoint of the Onleihe API.

- Scrapes German Onleihe libraries from the official help pages
- Handles cookie banners and dynamic content loading
- Exports clean, structured library data to JSON
- Automatic URL cleaning (removes frontend paths and parameters)
- **Note**: Currently focuses on German libraries only

### Chrome Extension
- Seamlessly integrates with **Amazon.de** and **Goodreads** book pages
- Real-time availability checking in your selected library
- Clean, responsive popup interface for library selection
- Supports German libraries
- Multilingual interface (German/English)
- Automatic search using book title, author, and ISBN information
- **New**: Full Goodreads.com support alongside Amazon.de

## 📋 Requirements

### For Web Scraping
- Python 3.7+
- Chrome/Chromium browser
- ChromeDriver (compatible with your Chrome version)

### For Chrome Extension
- Chrome/Chromium browser
- Developer mode enabled for extension installation

### For Firefox Add-on
- Firefox 60+ browser
- Add-on installation permissions

## 🛠 Installation

### Option 1: Browser Extensions (Recommended)

#### Chrome Web Store
**[📥 Install from Chrome Web Store](https://chromewebstore.google.com/detail/onleihe-checker/lbdbelkkmbogfjkeklmpfaijgpdnnncn?hl=de)**

#### Firefox Add-ons
**[📥 Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/onleihechecker/)**

This is the recommended installation method for most users:
- Automatic updates
- Verified security
- One-click installation
- No manual setup required

### Option 2: Manual Installation (Developer Mode)

#### 1. Web Scraper Setup

```bash
# Install required packages
pip install requests beautifulsoup4 selenium

# Install ChromeDriver (macOS with Homebrew)
brew install chromedriver

# Or download manually from https://chromedriver.chromium.org/
```

#### 2. Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `OnleiheChecker` folder

#### 3. Firefox Add-on Setup

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select the `manifest.json` file in the `OnleiheChecker_firefox` folder

## 🎯 Usage

### Web Scraping

#### Initial Library Data Collection
```bash
python scrape_onleihe.py
```

This will:
- Launch a Chrome browser instance
- Navigate to the official Onleihe library directory
- Handle cookie consent automatically
- Extract all library information
- Save results to `libraries.json`

#### Clean Existing URLs
If you have existing library data with messy URLs:
```bash
python clean_base_urls.py
```

This will clean up URLs by removing:
- `/frontend/welcome,51-0-0-100-0-0-1-0-0-0-0.html` suffixes
- Query parameters
- Unnecessary path segments

### Chrome Extension
![Amazon Page Screenshot](assets/175shots_so.png)
1. **Setup**: Click the extension icon in Chrome toolbar
2. **Select Library**: Search and select your local library from the dropdown
3. **Save**: Click "Bibliothek speichern" to set as default
4. **Browse**: Visit any **Amazon.de book page** or **Goodreads book page**
5. **Check**: The extension automatically displays Onleihe availability

### Firefox Add-on
The Firefox add-on works identically to the Chrome extension:
1. **Setup**: Click the add-on icon in Firefox toolbar
2. **Select Library**: Search and select your local library from the dropdown
3. **Save**: Click "Bibliothek speichern" to set as default
4. **Browse**: Visit any **Amazon.de book page** or **Goodreads book page**
5. **Check**: The add-on automatically displays Onleihe availability

#### Supported Websites
- ✅ **Amazon.de** - All book product pages (`/dp/` and `/gp/product/`)
- ✅ **Goodreads.com** - All book detail pages (`/book/show/`)

#### How it works
- **Amazon.de**: Extracts book information from product pages and displays availability status
- **Goodreads**: Reads book details from book pages and checks your library's catalog
- **Automatic Detection**: No manual switching needed - works seamlessly on both platforms

## 📁 Project Structure

```
root/
├── OnleiheScraper           # Onleihe Scraper
│   ├── clean_base_urls.py   # URL-Bereinigung
│   └── scrape_onleihe.py    # Haupt-Scraping-Skript
├── OnleiheChecker/          # Chrome Extension
│   ├── manifest.json        # Extension-Konfiguration
│   ├── popup.html           # Popup-Interface
│   ├── popup.js             # Popup-Funktionalität
│   ├── content.js           # Amazon-Integration
│   ├── background.js        # Service Worker
│   └── libraries.json       # Bibliotheksdatenbank
├── docs/                    # GitHub Pages
└── README.md                # This file
```

## 🔧 Configuration

### Scraper Settings

Edit `scrape_onleihe.py` to modify:

```python
# Enable/disable headless mode for debugging
chrome_options.add_argument('--headless')  # Comment out to see browser

# Adjust timeouts
WebDriverWait(driver, 20)  # Increase for slower connections
```

### Extension Settings

Libraries are automatically saved to Chrome's local storage. To reset:
1. Right-click extension icon → "Inspect popup"
2. Go to Application → Local Storage
3. Clear `selectedOnleiheLibraryURL` and `selectedOnleiheLibraryName`

## 🌍 Supported Libraries

### Web Scraper Coverage
The scraper currently extracts libraries from the German section of the Onleihe help pages:
- 🇩🇪 **Deutschland (Germany)** - All German libraries and regional networks

### Chrome Extension Support
The extension supports libraries from multiple countries through its pre-built database:
- 🇩🇪 Deutschland (Germany)

Other libraries will be added soon:
- 🇦🇹 Österreich (Austria)  
- 🇨🇭 Schweiz (Switzerland)
- 🇧🇪 Belgien (Belgium)
- 🇫🇷 Frankreich (France)
- 🇮🇹 Italien (Italy)
- 🇱🇺 Luxemburg (Luxembourg)
- 🇱🇮 Liechtenstein
- 🌐 International (Goethe-Institut, WDA)

> **Note**: To add international libraries to the scraper, the script would need to be extended to handle the international sections of the Onleihe help pages.

## 🐛 Troubleshooting

### Common Scraping Issues

**ChromeDriver not found:**
```bash
# macOS
brew install chromedriver
# Or set explicit path in script:
service = Service('/usr/local/bin/chromedriver')
```

**Cookie banner not dismissed:**
- Uncomment headless mode to see what's happening
- Check if the cookie button ID has changed
- Increase wait timeouts

**No libraries found:**
- Website structure may have changed
- Check if selectors need updating
- Verify internet connection

### Extension Issues

**Extension not loading:**
- Ensure Developer mode is enabled
- Check for errors in `chrome://extensions/`
- Reload the extension after changes

**No results on Amazon:**
- Verify library is selected in popup
- Check browser console for errors
- Ensure you're on a book product page (`/dp/` or `/gp/product/`)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is for educational and personal use. Please respect the terms of service of the websites being scraped.

## ⚠️ Disclaimer

- This tool is not affiliated with Onleihe or Amazon
- Use responsibly
- Website structures may change, requiring code updates
- Always verify availability directly on library websites

## 🔄 Maintenance

### Updating Library Data
Run the scraper periodically to keep German library information current:
```bash
# Update and clean German libraries
python scrape_onleihe.py && python clean_base_urls.py

# Copy updated data to extension
cp libraries.json OnleiheChecker/
```

> **Important**: The scraper currently only updates German libraries. International libraries in the extension database are maintained separately and may need manual updates.

## 🔒 Security & Permissions

The Chrome extension requires specific permissions to function properly. For a detailed explanation of each permission and why it's needed, see [PERMISSIONS.md](PERMISSIONS.md).

**Key principles:**
- Minimal permissions approach - only requests what's absolutely necessary
- No data collection or external tracking
- All processing happens locally in your browser
- Transparent operation with public library data only

---

**Made with ❤️ for German digital library users**
