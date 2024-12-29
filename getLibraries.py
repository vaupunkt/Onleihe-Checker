import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time


def get_libraries():

    url = "https://hilfe.onleihe.de/hilfe-onleihe-de/deine-onleihe-finden/c-3750"

     # Setup Chrome options for headless mode
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.binary_location = '/usr/bin/google-chrome'
    
    # Initialize headless Chrome driver
    service = Service('/usr/local/bin/chromedriver')
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.get(url)
    
    try:
        # Wait for category element to be present (max 10 seconds)
        libraries_element = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "Bayern"))
        )
        
        # Additional wait to ensure all categories are loaded
        time.sleep(2)
            
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        libraries = []
        library_elements = soup.select('.content div div h2, .content div div h3, .content div div ul li a')

        current_country = None

        for library in library_elements:
            if library.name == 'h2' and "Deutschland" in library.text.strip():
                current_country = "de"
                continue
            elif library.name == 'h3' and "Belgien" in library.text:
                current_country = "be"
                continue
            elif library.name == 'h3' and "Österreich" in library.text:
                current_country = "at"
                continue
            elif library.name == 'h3' and "Schweiz" in library.text:
                current_country = "ch"
                continue
            elif library.name == 'h3' and "Luxemburg" in library.text:
                current_country = "lu"
                continue
            elif library.name == 'h3' and "Italien" in library.text:
                current_country = "it"
                continue
            elif library.name == 'h3' and "Liechtenstein" in library.text:
                current_country = "li"
                continue
            elif library.name == 'h3' and "Frankreich" in library.text:
                current_country = "fr"
                continue
            elif  library.name == 'h3' and "Goethe-Institut" in library.text:
                current_country = "other"
                continue
            elif library.name == 'h3' and "Weltverband Deutscher Auslandsschulen (WDA)" in library.text:
                current_country = "other"
                continue
            elif library.name == 'a':
                id = library_elements.index(library)
                name = library.text.strip()
                baseURL = library.get('href')
                if "onleihe.de" in baseURL and "/frontend" in baseURL:
                    baseURL = baseURL.split("/frontend")[0]
                if "/frontend" in baseURL:
                    baseURL = baseURL.split("/frontend")[0]
                if baseURL.endswith("/"):
                    baseURL = baseURL[:-1]

                if "thuebibnet" in baseURL:
                    baseURL = "https://www.onleihe.de/thuebibnet"
                
                # Check if the current element is a country header
                if library.get('class') and 'country-header' in library.get('class'):
                    current_country = name


                libraries.append({
                'name': name,
                'baseURL': baseURL,
                'country': current_country,
                'id': id
                })

        return libraries
    
    
    finally:
        driver.quit()
