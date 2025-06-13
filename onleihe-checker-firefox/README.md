# Onleihe Checker Firefox Extension

## Overview
The Onleihe Checker is a Firefox extension that allows users to check the availability of books from their local library's Onleihe catalog directly from Amazon pages. This extension simplifies the process of finding out whether a book is available for borrowing.

## Features
- Search and select your library from a list.
- Save your preferred library for quick access.
- Check book availability on Amazon and display results from the Onleihe catalog.
- Supports localization for German and English languages.

## Project Structure
```
onleihe-checker-firefox
├── src
│   ├── background.js       # Background script for handling messages and CORS issues
│   ├── content.js          # Content script for interacting with web pages
│   ├── popup.html          # HTML structure for the popup interface
│   ├── popup.js            # Logic for the popup interface
│   ├── locales.js          # Localization management
│   └── libraries.json      # List of available libraries
├── icons
│   ├── icon16.png          # 16x16 pixel icon
│   ├── icon48.png          # 48x48 pixel icon
│   └── icon128.png         # 128x128 pixel icon
├── manifest.json           # Configuration file for the extension
├── web-ext-config.js       # Configuration for the web-ext tool
└── README.md               # Documentation for the project
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd onleihe-checker-firefox
   ```
3. Load the extension in Firefox:
   - Open Firefox and go to `about:debugging`.
   - Click on "This Firefox".
   - Click on "Load Temporary Add-on".
   - Select the `manifest.json` file from the project directory.

## Usage
- Click on the extension icon in the Firefox toolbar to open the popup.
- Select your library from the dropdown menu.
- Enter the book title or author on an Amazon page to check availability.
- The extension will display the results based on the Onleihe catalog.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.