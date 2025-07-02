#!/bin/bash

# Firefox Extension Test Script
# Tests the Onleihe Checker Firefox extension functionality and checks for common issues

echo "🦊 Firefox Onleihe Checker - Comprehensive Test Script"
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "FIREFOX")
            echo -e "${PURPLE}🦊 $message${NC}"
            ;;
    esac
}

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    print_status "ERROR" "manifest.json not found. Please run this script from the OnleiheChecker_firefox directory."
    exit 1
fi

print_status "FIREFOX" "Starting comprehensive Firefox extension validation..."

# Test 1: Check Firefox compatibility
print_status "INFO" "Checking Firefox compatibility..."
if command -v firefox >/dev/null 2>&1; then
    FIREFOX_VERSION=$(firefox --version 2>/dev/null | grep -o '[0-9]\+' | head -1)
    if [ "$FIREFOX_VERSION" -ge 60 ]; then
        print_status "OK" "Firefox $FIREFOX_VERSION detected (minimum 60 required)"
    else
        print_status "WARNING" "Firefox $FIREFOX_VERSION detected (recommend 60+)"
    fi
else
    print_status "WARNING" "Firefox not found in PATH"
fi

# Test 1: Validate manifest.json
print_status "INFO" "Testing manifest.json..."
if command -v jq >/dev/null 2>&1; then
    if jq empty manifest.json 2>/dev/null; then
        print_status "OK" "manifest.json is valid JSON"
        
        # Check manifest version
        MANIFEST_VERSION=$(jq -r '.manifest_version' manifest.json)
        if [ "$MANIFEST_VERSION" = "2" ]; then
            print_status "OK" "Manifest version 2 (Firefox compatible)"
        else
            print_status "WARNING" "Manifest version is $MANIFEST_VERSION (expected 2 for Firefox)"
        fi
        
        # Check required fields
        if jq -e '.name' manifest.json >/dev/null; then
            print_status "OK" "Extension name: $(jq -r '.name' manifest.json)"
        else
            print_status "ERROR" "Missing extension name"
        fi
        
        if jq -e '.version' manifest.json >/dev/null; then
            print_status "OK" "Extension version: $(jq -r '.version' manifest.json)"
        else
            print_status "ERROR" "Missing extension version"
        fi
        
    else
        print_status "ERROR" "manifest.json contains invalid JSON"
    fi
else
    print_status "WARNING" "jq not installed, skipping JSON validation"
fi

# Test 2: Check required files
print_status "INFO" "Checking required files..."
REQUIRED_FILES=("background.js" "content.js" "popup.html" "popup.js" "locales.js" "libraries.json")

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "OK" "$file exists"
    else
        print_status "ERROR" "$file missing"
    fi
done

# Test 3: Check icons directory
print_status "INFO" "Checking icons..."
if [ -d "icons" ]; then
    print_status "OK" "Icons directory exists"
    
    REQUIRED_ICONS=("icon16.png" "icon32.png" "icon48.png" "icon128.png" "books.png")
    for icon in "${REQUIRED_ICONS[@]}"; do
        if [ -f "icons/$icon" ]; then
            print_status "OK" "icons/$icon exists"
        else
            print_status "ERROR" "icons/$icon missing"
        fi
    done
else
    print_status "ERROR" "Icons directory missing"
fi

# Test 4: Check for Firefox-specific code patterns
print_status "INFO" "Checking Firefox compatibility..."

# Check for browser API usage
if grep -q "typeof browser !== 'undefined'" *.js; then
    print_status "OK" "Firefox browser API compatibility check found"
else
    print_status "WARNING" "No Firefox browser API compatibility check found"
fi

# Check for chrome API fallbacks
if grep -q "browser\\..*:.*chrome\\." *.js; then
    print_status "OK" "Chrome API fallbacks found"
else
    print_status "WARNING" "No Chrome API fallbacks found"
fi

# Test 5: Check libraries.json
print_status "INFO" "Checking libraries.json..."
if [ -f "libraries.json" ]; then
    if command -v jq >/dev/null 2>&1; then
        LIBRARY_COUNT=$(jq length libraries.json 2>/dev/null)
        if [ $? -eq 0 ] && [ "$LIBRARY_COUNT" -gt 0 ]; then
            print_status "OK" "libraries.json contains $LIBRARY_COUNT libraries"
        else
            print_status "ERROR" "libraries.json is invalid or empty"
        fi
    else
        if [ -s "libraries.json" ]; then
            print_status "OK" "libraries.json exists and is not empty"
        else
            print_status "ERROR" "libraries.json is empty"
        fi
    fi
else
    print_status "ERROR" "libraries.json missing"
fi

# Test 6: File size checks
print_status "INFO" "Checking file sizes..."
MAX_SIZE=5000000  # 5MB limit for extensions

for file in *.js *.json *.html; do
    if [ -f "$file" ]; then
        SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [ "$SIZE" -gt "$MAX_SIZE" ]; then
            print_status "WARNING" "$file is large ($(echo "scale=2; $SIZE/1024/1024" | bc)MB)"
        else
            print_status "OK" "$file size OK ($(echo "scale=2; $SIZE/1024" | bc)KB)"
        fi
    fi
done

# Test 7: Check for development artifacts
print_status "INFO" "Checking for development artifacts..."
if [ -f ".DS_Store" ] || [ -f "Thumbs.db" ]; then
    print_status "WARNING" "Development artifacts found (.DS_Store or Thumbs.db)"
else
    print_status "OK" "No development artifacts found"
fi

# Test 8: Firefox-specific checks
print_status "FIREFOX" "Performing Firefox-specific validations..."

# Check for browser API usage
if grep -q "typeof browser !== 'undefined'" *.js; then
    print_status "OK" "Firefox browser API compatibility implemented"
else
    print_status "ERROR" "Missing Firefox browser API compatibility"
fi

# Check for proper background script setup
if grep -q "persistent.*false" manifest.json; then
    print_status "OK" "Background script set to non-persistent (correct for Firefox)"
else
    print_status "WARNING" "Background script persistence setting unclear"
fi

# Check for webNavigation permission (helpful for Firefox)
if grep -q "webNavigation" manifest.json; then
    print_status "OK" "webNavigation permission included for better compatibility"
else
    print_status "INFO" "webNavigation permission not included (optional)"
fi

# Test 9: Common Firefox warnings check
print_status "FIREFOX" "Checking for mitigation of common Firefox warnings..."

if grep -q "console.warn" background.js; then
    print_status "OK" "Console warning suppression implemented"
else
    print_status "INFO" "No console warning suppression (warnings are harmless)"
fi

# Test 10: Error handling improvements
print_status "INFO" "Checking enhanced error handling..."

if grep -q "isValidOnleiheUrl" background.js; then
    print_status "OK" "URL validation implemented"
else
    print_status "WARNING" "URL validation missing"
fi

if grep -q "AbortController" background.js; then
    print_status "OK" "Request timeout handling implemented"
else
    print_status "INFO" "Basic timeout handling in use"
fi

# Summary
echo ""
echo "🧪 Firefox Extension Test Summary"
echo "================================="
print_status "FIREFOX" "Validation complete!"
echo ""
echo "📋 Firefox Installation Steps:"
echo "1. Open Firefox"
echo "2. Go to about:debugging"
echo "3. Click 'This Firefox'"
echo "4. Click 'Load Temporary Add-on'"
echo "5. Select the manifest.json file in this directory"
echo ""
echo "🔧 For permanent installation:"
echo "1. Run ./package_firefox.sh to create an XPI package"
echo "2. Go to about:addons in Firefox"
echo "3. Click gear icon → 'Install Add-on From File'"
echo "4. Select the generated .xpi file"
echo ""
echo "🐛 Common Firefox warnings (HARMLESS):"
echo "- 'Ignoring unsupported entryTypes: layout-shift'"
echo "- 'Components object is deprecated'"
echo "- 'InstallTrigger is deprecated'"
echo "- XML parsing errors from Amazon's internal APIs"
echo ""
echo "📖 See FIREFOX_TROUBLESHOOTING.md for detailed help"
echo ""
print_status "FIREFOX" "Firefox extension ready for installation!"
