# Onleihe Checker v1.0 - Initial Release

🎉 **First stable release of Onleihe Checker!**

A Chrome extension that seamlessly integrates with Amazon.de to check book availability in German digital libraries (Onleihe) while you browse.

## 🌟 Key Features

### ✅ Amazon.de Integration
- **Automatic Detection**: Works on all Amazon.de book product pages (`/dp/` and `/gp/product/`)
- **Smart Book Recognition**: Extracts title, author, and ISBN information automatically
- **Real-time Status**: Shows availability results directly on the Amazon page
- **Clean Interface**: Unobtrusive widget that blends with Amazon's design

### 📚 Comprehensive Library Support
- **450+ German Libraries**: Complete coverage of German Onleihe networks
- **Regional Networks**: Support for major library consortiums (LEO, Franken-Onleihe, etc.)
- **Custom Domains**: Handles specialized library domains and URL structures
- **Automatic Updates**: Library database stays current with official sources

### 🌍 Multilingual Experience
- **German & English Interface**: Full localization support
- **Dynamic Language Switching**: Change language without restarting
- **Contextual Translations**: All messages and UI elements properly localized
- **Browser Language Detection**: Automatically detects your preferred language

### 🔍 Intelligent Search
- **Multi-field Search**: Uses title, author, and ISBN for best results
- **Fallback Strategy**: Automatically tries different search terms if first attempt fails
- **Result Counting**: Shows exact number of available titles
- **Direct Links**: One-click access to library catalog for detailed view

### ⚙️ User-Friendly Setup
- **Simple Configuration**: Easy library selection through searchable dropdown
- **Persistent Settings**: Remembers your library choice across browser sessions
- **Visual Feedback**: Clear status messages and loading indicators
- **Error Handling**: Helpful error messages with troubleshooting guidance

## 🛠 Technical Highlights

### Performance & Reliability
- **Background Processing**: Non-blocking search requests don't slow down browsing
- **CORS Bypass**: Innovative solution to access library data despite restrictions
- **Retry Logic**: Automatic retry mechanism for failed requests
- **Memory Efficient**: Minimal resource usage with on-demand activation

### Privacy & Security
- **Local Processing**: All book data extraction happens locally
- **No Tracking**: Zero data collection or external analytics
- **Minimal Permissions**: Only requests necessary browser permissions
- **Transparent Operation**: Open source with documented permission usage

### Browser Compatibility
- **Manifest V3**: Built for modern Chrome extension standards
- **Service Worker**: Efficient background processing
- **Content Security**: Secure script injection and data handling
- **Cross-Tab Sync**: Language settings sync across multiple Amazon tabs

## 📊 What's Included

### Core Components
- **Chrome Extension**: Ready-to-install browser extension
- **Web Scraper**: Python tool for updating library database
- **URL Cleaner**: Utility for maintaining clean library URLs
- **Documentation**: Comprehensive setup and usage guides

### Library Database
- **450+ Libraries**: Complete German Onleihe network coverage
- **Structured Data**: Clean, organized library information
- **Country Codes**: Proper geographic categorization
- **Verified URLs**: All links tested and validated

## 🚀 Getting Started

1. **Download** the extension files
2. **Enable** Developer mode in Chrome (`chrome://extensions/`)
3. **Load** the unpacked extension
4. **Select** your library from the popup
5. **Browse** Amazon.de and see availability status automatically!

## 🔧 For Developers

### Web Scraping Tools
```bash
# Scrape latest library data
python scrape_onleihe.py

# Clean and optimize URLs
python clean_base_urls.py

# Update extension database
cp libraries.json OnleiheChecker/
```

### Extension Architecture
- **Popup Interface**: Modern, responsive library selection
- **Content Script**: Amazon page integration and book detection
- **Background Service**: CORS-free library data fetching
- **Localization System**: Embedded and external translation support

## 📋 System Requirements

- **Chrome Browser**: Version 88 or higher
- **Operating System**: Windows, macOS, or Linux
- **Internet Connection**: Required for library availability checks
- **Permissions**: See the Permissions.md for details

## 🌐 Supported Libraries

### Currently Supported
- 🇩🇪 **All German Onleihe Libraries** (450+)
- Major networks: LEO-SUED, LEO-NORD, Franken-Onleihe, VOEBB, etc.
- Regional systems: MetropolBib, DigiBobb, BiblioLoad, and more

### Future Expansion
- 🇦🇹 Austrian libraries (planned)
- 🇨🇭 Swiss libraries (planned)
- 🌍 International Goethe-Institut locations (planned)

## 🐛 Known Limitations

- Currently only supports Amazon.de (not .com or other domains)
- Some very new libraries may not be included yet
- Requires active internet connection for availability checks
- Search results depend on library catalog search functionality

## 💡 Tips for Best Results

1. **Library Selection**: Choose your local library for most accurate results
2. **Network**: Ensure stable internet connection for real-time checks
3. **Book Pages**: Works best on main book product pages
4. **Language**: Set preferred language in extension popup
5. **Updates**: Periodically check for library database updates

## 🤝 Contributing

We welcome contributions! See our repository for:
- Bug reports and feature requests
- Library database updates
- Translation improvements
- Code contributions

## 📞 Support

- **Documentation**: Check README.md for detailed setup instructions
- **Permissions**: See BERECHTIGUNGEN.md for security information
- **Issues**: Report problems via GitHub issues
- **Updates**: Watch repository for new releases

---

**Happy Reading! 📖**

*Discover the convenience of checking your local digital library without leaving Amazon. Support your local libraries while browsing for your next great read!*

## 🏷️ Version Information

- **Version**: 1.0.0
- **Release Date**: [Current Date]
- **Compatibility**: Chrome 88+, Manifest V3
- **File Size**: ~200KB
- **Languages**: German, English
- **License**: Educational/Personal Use

**Download Size**: ~200KB  
**Installation Time**: < 1 minute  
**Setup Complexity**: Beginner-friendly
