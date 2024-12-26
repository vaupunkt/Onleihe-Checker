from bs4 import BeautifulSoup
import requests
from models import Category, Book
from storeBooks import store_book


def get_books(library, session1, Session2):

    url = library.baseURL + "/frontend/mediaList,0-0-0-102-0-0-0-0-400001-0-0.html"

    page = 1

    with session1.no_autoflush:
        while True:
            # Send a GET request to the URL
            urlStart = url.split(',')[0]
            urlEnd = url.split('.html')[1]
            if page == 1:
                url = url
            else:
                url = urlStart + ',0-0-0-102-0-0-'+str(page-1)+'-2004-400001-0-0.html'
            response = requests.get(url)
            # Parse the response content with BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')

            # Find books on current page
            books_on_page = soup.select('.col.card-group')
            
            # Break if no more books found
            if not books_on_page:
                break

            for book in books_on_page:
                title = book.select_one('.headline.card-title.truncate2Lines').text.strip()
                link = url.split("media")[0] + book.select_one('.link.stretched-link').get('href')
                book_id = link.split('mediaInfo,0-0-')[1].split('-')[0]

                print(f"Processing book {title} - {book_id} - {link}")
                book_in_db = session1.query(Book).filter(Book.id == book_id).first()
                if book_in_db:
                    library_ids = book_in_db.library_ids.split('; ')
                    if (library.id in library_ids):
                        print(f"Library {library.name} already in database")
                        continue
                    else:
                        new_library_ids = book_in_db.library_ids +"; "+ str(library.id) + "; "
                        book_data = {
                            'id': book_in_db.id,
                            'title': book_in_db.title,
                            'author': book_in_db.author,
                            'publisher': book_in_db.publisher,
                            'isbn': book_in_db.isbn,
                            'library_ids': new_library_ids.rstrip("; "),
                            'language': book_in_db.language,
                            'category_ids': book_in_db.category_ids.rstrip("; "),
                            'year': book_in_db.year,
                            'link': link.split("/frontend/")[1]
                        }
                        store_book(book_data, Session2)
                        continue
                else:
                    response = requests.get(link)
                    soup = BeautifulSoup(response.text, 'html.parser')

                    attributes = {}
                    titleInfos = soup.select('.horizontalDescription')
                    for info in titleInfos:
                        key = info.select_one('b').text.strip().removesuffix(':')
                        value = info.select_one('span').text.strip().split('\n')
                        if len(value) == 1:
                            value = value[0]
                        else:
                            for i in range(len(value)):
                                value[i] = value[i].removesuffix(',').removesuffix(";")
                        
                        if key == 'Kategorie':
                            value_list = info.select('span a')
                            category_ids = ""
                            for item in value_list:
                                item_id = item.get('href').split('-')[1]
                                category_ids = category_ids + item_id + "; "

                            attributes[key] = category_ids.rstrip("; ")
                        
                        elif key == 'Autor*in':
                            value_list = info.select('span a')

                            authors = "; ".join([author.text for author in value_list])
                            attributes[key] = authors
                        
                        else: attributes[key] = value

                    title = title
                    author = attributes['Autor*in'] if 'Autor*in' in attributes else ''
                    year = attributes['Jahr'] if 'Jahr' in attributes else ''
                    language = attributes['Sprache'] if 'Sprache' in attributes else ''
                    publisher = attributes['Verlag'] if 'Verlag' in attributes else ''
                    isbn = attributes['ISBN'] if 'ISBN' in attributes else ''
                    category = attributes['Kategorie'] if 'Kategorie' in attributes else ''
                
                    book_data = {
                        'id': book_id,
                        'title': title,
                        'author': author,
                        'publisher': publisher,
                        'isbn': isbn,
                        'library_ids': str(library.id), 
                        'language': language,
                        'category_ids': category.rstrip("; "),
                        'year': year,
                        'link': link.split("/frontend/")[1]
                    }

                    store_book(book_data, Session2)

            
            print(f"Processed page {page}, found {len(books_on_page)} books")
            page += 1
        print(f"Finished processing {library.name}")