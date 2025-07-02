#!/bin/bash

# Firefox Extension Package Script
# Creates a distributable .xpi package for the Onleihe Checker Firefox extension

echo "🦊 Firefox Onleihe Checker - Package Creation Script"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: manifest.json not found. Please run this script from the OnleiheChecker_firefox directory."
    exit 1
fi

# Create temporary directory for packaging
TEMP_DIR="temp_firefox_package"
PACKAGE_NAME="onleihe-checker-firefox-1.2.xpi"

echo "📦 Creating package directory..."
mkdir -p "$TEMP_DIR"

# Copy all necessary files
echo "📋 Copying files..."
cp manifest.json "$TEMP_DIR/"
cp background.js "$TEMP_DIR/"
cp content.js "$TEMP_DIR/"
cp popup.html "$TEMP_DIR/"
cp popup.js "$TEMP_DIR/"
cp locales.js "$TEMP_DIR/"
cp libraries.json "$TEMP_DIR/"
cp README_FIREFOX.md "$TEMP_DIR/"
cp -r icons "$TEMP_DIR/"

# Create the .xpi package (which is just a ZIP file with a different extension)
echo "🗜️  Creating XPI package..."
cd "$TEMP_DIR"
zip -r "../$PACKAGE_NAME" ./*
cd ..

# Clean up
echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"

# Validate the package
if [ -f "$PACKAGE_NAME" ]; then
    echo "✅ Successfully created: $PACKAGE_NAME"
    echo "📏 Package size: $(ls -lh $PACKAGE_NAME | awk '{print $5}')"
    echo ""
    echo "🔧 Installation Instructions:"
    echo "1. Open Firefox"
    echo "2. Go to about:addons"
    echo "3. Click the gear icon and select 'Install Add-on From File'"
    echo "4. Select the $PACKAGE_NAME file"
    echo ""
    echo "🧪 For Development/Testing:"
    echo "1. Go to about:debugging"
    echo "2. Click 'This Firefox'"
    echo "3. Click 'Load Temporary Add-on'"
    echo "4. Select the manifest.json file in this directory"
else
    echo "❌ Error: Package creation failed"
    exit 1
fi

echo "🎉 Firefox extension package ready!"
