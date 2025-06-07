import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import re
import json # Importiere das json Modul

def get_libraries_and_save_to_json():
    url = "https://hilfe.onleihe.de/hilfe-onleihe-de/deine-onleihe-finden/c-3750"

    # Setup Chrome options for headless mode
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    # Pfad zum Chromedriver angeben, falls er nicht im PATH liegt.
    # Wenn chromedriver in deinem System-PATH ist, kannst du 'service=Service(...)' weglassen.
    # service = Service('/usr/local/bin/chromedriver') 
    
    driver = None
    libraries = []

    try:
        # Initialisiere den Headless Chrome Driver
        # Verwende service=service, wenn du den Pfad manuell angeben musst.
        driver = webdriver.Chrome(options=chrome_options) 
        driver.get(url)
        
        # Warte auf ein spezifischeres Element, das anzeigt,
        # dass die Hauptinhalte geladen sind.
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Onleihen in Deutschland')]"))
        )
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        content_div = soup.find('div', class_='content')
        if not content_div:
            print("Fehler: Haupt-Content-Bereich nicht gefunden.")
            return

        current_country_code = None
        
        # Iteriere durch die direkten Kinder des Content-Divs, um Länder und Bibliotheken zu erkennen.
        for element in content_div.children:
            # Überprüfe, ob es sich um eine Länderüberschrift (h2) handelt
            if element.name == 'h2':
                country_text = element.get_text(strip=True)
                if "Deutschland" in country_text:
                    current_country_code = "de"
                elif "Belgien" in country_text:
                    current_country_code = "be"
                elif "Österreich" in country_text:
                    current_country_code = "at"
                elif "Schweiz" in country_text:
                    current_country_code = "ch"
                elif "Luxemburg" in country_text:
                    current_country_code = "lu"
                elif "Italien" in country_text:
                    current_country_code = "it"
                elif "Liechtenstein" in country_text:
                    current_country_code = "li"
                elif "Frankreich" in country_text:
                    current_country_code = "fr"
                elif "Goethe-Institut" in country_text or "Weltverband Deutscher Auslandsschulen" in country_text:
                    current_country_code = "other"
                else: 
                    current_country_code = None
            
            # Überprüfe, ob es sich um eine Liste (ul) handelt und ein Land zugeordnet ist
            elif element.name == 'ul' and current_country_code:
                for li in element.find_all('li'):
                    a_tag = li.find('a', href=True)
                    if a_tag:
                        name = a_tag.get_text(strip=True)
                        baseURL = a_tag.get('href')

                        # Bereinige die baseURL, um die Hauptdomain der Onleihe zu erhalten.
                        # Beispiel: "https://voebb.onleihe.de" von "https://voebb.onleihe.de/voebb/frontend..."
                        match = re.match(r"(https?://[^/]+\.onleihe\.de)", baseURL)
                        if match:
                            clean_baseURL = match.group(1)
                        else:
                            # Fallback für unerwartete URLs, sollte aber mit dem RegEx seltener nötig sein
                            clean_baseURL = baseURL.split("/frontend")[0] if "/frontend" in baseURL else baseURL
                            if clean_baseURL.endswith("/"):
                                clean_baseURL = clean_baseURL[:-1]
                        
                        libraries.append({
                            'name': name,
                            'baseURL': clean_baseURL,
                            'country': current_country_code,
                        })
    
    except Exception as e:
        print(f"Ein Fehler ist während des Scrapings aufgetreten: {e}")
    finally:
        if driver:
            driver.quit()
            
    # Speichere die gesammelten Bibliotheken in einer JSON-Datei
    if libraries:
        try:
            with open('libraries.json', 'w', encoding='utf-8') as f:
                json.dump(libraries, f, ensure_ascii=False, indent=2)
            print(f"\n{len(libraries)} Bibliotheken erfolgreich in 'libraries.json' gespeichert.")
        except Exception as e:
            print(f"Fehler beim Speichern der JSON-Datei: {e}")
    else:
        print("Keine Bibliotheken zum Speichern gefunden.")

# Beispielaufruf, um die JSON-Datei zu generieren
if __name__ == "__main__":
    get_libraries_and_save_to_json()
