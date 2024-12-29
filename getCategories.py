from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from bs4 import BeautifulSoup
import time

def get_categories(library):
    url = library.baseURL + "/frontend/mediaList,0-0-0-102-0-0-0-0-400001-0-0.html"
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
        category_element = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "category_facet"))
        )
        
        # Additional wait to ensure all categories are loaded
        time.sleep(2)
        
        # Get page source after JavaScript execution
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        categories = []
        category_elements = soup.select('#category_facet ul.vertical.menu.drilldown a div')
        
        for category in category_elements:
            name = category.text.strip()
            parent_a = category.parent
            value = parent_a.get('data-value', '')
            
            clean_name = name.split('(')[0].strip()
            categories.append({
                'name': clean_name,
                'link': "?category.filter=" + value,
                'id': value
            })
        
        return categories
        
    finally:
        driver.quit()
