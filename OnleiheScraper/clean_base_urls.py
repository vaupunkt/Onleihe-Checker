import json
import re
from urllib.parse import urlparse

def clean_base_url(url):
    """
    Clean baseURL by removing frontend paths and query parameters.
    Keep only the base domain and main path segment.
    """
    if not url:
        return url
    
    # Parse the URL
    parsed = urlparse(url)
    
    # Start with the base URL (scheme + netloc)
    clean_url = f"{parsed.scheme}://{parsed.netloc}"
    
    # Process the path
    path_parts = [part for part in parsed.path.split('/') if part]
    
    # Keep only the main path segment (like 'thuebibnet', 'verbund_hessen', etc.)
    # Remove 'frontend' and everything after it
    clean_path_parts = []
    for part in path_parts:
        if part == 'frontend':
            break
        clean_path_parts.append(part)
    
    # Add the cleaned path
    if clean_path_parts:
        clean_url += '/' + '/'.join(clean_path_parts)
    
    # Ensure trailing slash for consistency
    if not clean_url.endswith('/'):
        clean_url += '/'

        # Special rule for Oberlausitz URL transformation
    if clean_url.startswith('https://www.onleihe-oberlausitz.de'):
        clean_url = 'https://oberlausitz.onleihe.de/oberlausitz/'
    
    if clean_url.startswith('https://www.ostalb-onleihe.de/'):
        clean_url = 'https://ostalb.onleihe.de/ostalb/'
    
    
    return clean_url

def clean_libraries_json():
    """Clean the baseURL values in libraries.json"""
    try:
        with open('libraries.json', 'r', encoding='utf-8') as f:
            libraries = json.load(f)
        
        print(f"Loaded {len(libraries)} libraries from libraries.json")
        
        cleaned_count = 0
        for library in libraries:
            if 'baseURL' in library:
                original_url = library['baseURL']
                cleaned_url = clean_base_url(original_url)
                
                if original_url != cleaned_url:
                    library['baseURL'] = cleaned_url
                    cleaned_count += 1
                    print(f"Cleaned: {library.get('name', 'Unknown')}")
                    print(f"  From: {original_url}")
                    print(f"  To:   {cleaned_url}")
                    print()
        
        # Save the cleaned data
        with open('libraries.json', 'w', encoding='utf-8') as f:
            json.dump(libraries, f, ensure_ascii=False, indent=2)
        
        print(f"Cleaning complete! {cleaned_count} URLs were cleaned.")
        
    except Exception as e:
        print(f"Error cleaning libraries.json: {e}")

if __name__ == "__main__":
    clean_libraries_json()
