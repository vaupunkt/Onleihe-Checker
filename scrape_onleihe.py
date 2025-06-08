import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import re
import json
import time

def get_libraries_and_save_to_json():
    url = "https://hilfe.onleihe.de/hilfe-onleihe-de/deine-onleihe-finden/c-3750"

    chrome_options = Options()
    # Für dieses Debugging BITTE die folgende Zeile AUSKOMMENTIEREN,
    # damit sich ein Browserfenster öffnet und du die Seite sehen kannst!
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    # Optional: Pfad zum Chromedriver angeben, falls er nicht im PATH liegt.
    # service = Service('/usr/local/bin/chromedriver') 
    
    driver = None
    libraries = []

    print("Starte Webdriver...")
    try:
        driver = webdriver.Chrome(options=chrome_options) 
        driver.get(url)
        print(f"Seite geladen: {url}")

        # Screenshot VOR der Cookie-Interaktion
        driver.save_screenshot('debug_onleihe_page_initial.png')
        print("Screenshot 'debug_onleihe_page_initial.png' erstellt (Zustand vor Cookie-Interaktion).")

        print("Versuche, den Cookie-Banner zu schließen/akzeptieren...")
        try:
            # Zusätzliche Wartezeit, um dem Banner Zeit zum Rendern zu geben
            time.sleep(3) 

            # Warte auf den spezifischen Button mit der ID "whcookiemanager_select_all"
            cookie_accept_button = WebDriverWait(driver, 15).until( # Erhöhter Timeout
                EC.element_to_be_clickable((By.ID, "whcookiemanager_select_all"))
            )
            
            # Versuche, den Button normal zu klicken
            cookie_accept_button.click()
            print("Cookie-Banner-Button ('Alle akzeptieren') geklickt (Standardmethode).")
            time.sleep(2) # Kurze Wartezeit, damit das Banner verschwindet
        except Exception as e:
            print(f"Fehler beim Standard-Klick des Cookie-Banner-Buttons (ID 'whcookiemanager_select_all'): {e}")
            print("Versuche alternativ, per JavaScript zu klicken...")
            try:
                # Fallback: Versuche, per JavaScript zu klicken, falls der Standard-Klick fehlschlägt
                driver.execute_script("document.getElementById('whcookiemanager_select_all').click();")
                print("Cookie-Banner-Button per JavaScript geklickt.")
                time.sleep(2) # Kurze Wartezeit, damit das Banner verschwindet
            except Exception as js_e:
                print(f"Fehler beim Klicken per JavaScript: {js_e}")
                print("Fahre fort ohne Cookie-Interaktion (dies könnte das Scraping blockieren).")
        
        # Screenshot NACH der Cookie-Interaktion (oder dem fehlgeschlagenen Versuch)
        driver.save_screenshot('debug_onleihe_page_after_cookie.png')
        print("Screenshot 'debug_onleihe_page_after_cookie.png' erstellt (Zustand nach Cookie-Interaktion).")

        # Warte auf das Haupt-Content-Element ('Onleihen in Deutschland') als Marker
        print("Warte auf das Haupt-Content-Element ('Onleihen in Deutschland')...")
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.XPATH, "//h2[@id='Onleihen in Deutschland']"))
        )
        print("Haupt-Content-Element gefunden.")
        
        time.sleep(3) # Zusätzliche kurze Wartezeit für das Rendering

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # NEUE STRATEGIE: Finde alle relevanten Überschriften und iteriere dann ihre nachfolgenden ULs.
        # Wir suchen nach allen h2 (Länderüberschriften) und h3 (Bundesländer/Regionen)
        # und verarbeiten dann die nachfolgenden p- und ul-Tags.
        
        # Finde den div, der das Haupt-Content enthält (oftmals der Body selbst oder ein sehr großer Container)
        # Basierend auf dem HTML-Schnipsel, den du vorher gesendet hast, scheinen die h2/h3/p/ul Tags 
        # direkt im body oder einem generischen div ohne spezifische Klasse zu liegen.
        # Der Selektor '.content' war wohl zu spezifisch und hat nur kleine Teile gefunden.
        # Wir suchen jetzt nach allen h2 und h3, und verarbeiten dann deren Nachfolger.
        
        # Starte mit dem Body, da das Inhaltsverzeichnis und die Listen direkt im Body zu sein scheinen.
        # Alternativ, wenn es einen übergeordneten DIV gibt, der alles enthält:
        # main_container = soup.find('div', id='some_main_content_id') # wenn vorhanden
        # Falls nicht, ist body ein guter Startpunkt
        main_container = soup.body 

        if not main_container:
            print("Fehler: Haupt-Container (body) nicht gefunden.")
            return

        print("Haupt-Container gefunden. Beginne mit der Analyse der Überschriften und Listen...")
        
        current_country_code = None
        found_any_library = False

        # Finde alle h2 und h3 Elemente, die potenzielle Länder- oder Regionen-Header sind
        all_headers = main_container.find_all(['h2', 'h3'])
        
        # Durchlaufe die Header und die ihnen folgenden Elemente
        for header in all_headers:
            header_text = header.get_text(strip=True)
            
            if header.name == 'h2':
                # Spezifische Behandlung für H2-Länderüberschriften
                if "Onleihen in Deutschland" in header_text:
                    current_country_code = "de"
                    print(f"\n--- H2-Header gefunden: '{header_text}' -> Setze Land auf '{current_country_code}' ---")
                elif "Onleihen international" in header_text:
                    # Wenn wir den internationalen Bereich erreichen, setzen wir den Ländercode zurück,
                    # bis ein spezifisches Land kommt
                    current_country_code = None 
                    print(f"\n--- H2-Header gefunden: '{header_text}' -> Setze Land auf 'None' ---")
                else:
                    print(f"\n--- H2-Header (unbekannt): '{header_text}' ---")
                    current_country_code = None # Für den Fall, dass andere H2s auftreten
            
            elif header.name == 'h3':
                # H3-Header sind Bundesländer/Regionen innerhalb eines Landes
                # Ihr Ländercode bleibt der des vorherigen H2-Headers
                print(f"--- H3-Header gefunden: '{header_text}' (akt. Land: {current_country_code}) ---")

            # Iteriere über die Geschwisterelemente, die nach dem aktuellen Header kommen
            # bis der nächste h2 oder h3 erreicht wird
            for sibling in header.find_next_siblings():
                if sibling.name == 'h2' or sibling.name == 'h3':
                    # Wir haben den nächsten Header erreicht, stoppe die Iteration für diesen Block
                    break 
                
                if sibling.name == 'ul' and current_country_code:
                    print(f"  [UL-LISTE GEFUNDEN] Verarbeite Bibliotheken unter Land '{current_country_code}'")
                    for li_idx, li in enumerate(sibling.find_all('li')):
                        a_tag = li.find('a', href=True)
                        if a_tag:
                            found_any_library = True
                            name = a_tag.get_text(strip=True)
                            baseURL = a_tag.get('href')

                            libraries.append({
                                'name': name,
                                'baseURL': baseURL,
                                'country': current_country_code,
                            })
                            # print(f"    -> Bibliothek hinzugefügt ({li_idx}): '{name}' ({clean_baseURL})")
                        # else:
                            # print(f"    -> LI-Element {li_idx} ohne anklickbaren Link gefunden.")
                # elif sibling.name == 'p': # Zeigt die Buchstaben-Header an
                    # print(f"  [P-TAG GEFUNDEN] '{sibling.get_text(strip=True)}'")
                # else:
                    # print(f"  [ÜBERSPRINGE] Nicht-Listen-Element: <{sibling.name}>")

        if not found_any_library:
            print("\nDebugging-Info: Nach der Schleife wurden KEINE Bibliotheken gefunden.")
        else:
            print(f"\nDebugging-Info: {len(libraries)} Bibliotheken gefunden.")


    except Exception as e:
        print(f"\nEin kritischer Fehler ist während des Scrapings aufgetreten: {e}")
        # print("\nGesamter Seitenquelltext zum Zeitpunkt des Fehlers:\n", driver.page_source)
    finally:
        if driver:
            driver.quit()
            print("Webdriver geschlossen.")
            
    if libraries:
        try:
            with open('libraries.json', 'w', encoding='utf-8') as f:
                json.dump(libraries, f, ensure_ascii=False, indent=2)
            print(f"\n{len(libraries)} Bibliotheken erfolgreich in 'libraries.json' gespeichert.")
        except Exception as e:
            print(f"Fehler beim Speichern der JSON-Datei: {e}")
    else:
        print("\nKeine Bibliotheken zum Speichern gefunden.")

if __name__ == "__main__":
    get_libraries_and_save_to_json()
