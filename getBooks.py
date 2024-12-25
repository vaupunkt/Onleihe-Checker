from bs4 import BeautifulSoup
import requests
from models import Category, Book
from storeBooks import store_books


def get_books(library, session, Session):

    url = library.baseURL + "/frontend/mediaList,0-0-0-102-0-0-0-0-400001-0-0.html?category.filter=0"

    page = 1

    while True:
        # Send a GET request to the URL
        urlStart = url.split(',')[0]
        urlEnd = url.split('.html')[1]
        if page == 1:
            url = url
        else:
            url = urlStart + ',0-0-0-102-0-0-'+str(page-1)+'-2004-400001-0-0.html' + urlEnd
        response = requests.get(url)
        # Parse the response content with BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find books on current page
        books_on_page = soup.select('.col.card-group')
        
        # Break if no more books found
        if not books_on_page:
            break
        books_to_store = []

        for book in books_on_page:
            title = book.select_one('.headline.card-title.truncate2Lines').text.strip()
            link = book.select_one('.link.stretched-link').get('href')
            book_id = link.split('mediaInfo,0-0-')[1].split('-')[0]

            book_in_db = session.query(Book).filter(Book.id == book_id).first()
            if book_in_db:
                print(f"Book {book_in_db.title} already in database")
                book_data = {
                    'id': book_in_db.id,
                    'title': book_in_db.title,
                    'author': book_in_db.author,
                    'publisher': book_in_db.publisher,
                    'isbn': book_in_db.isbn,
                    'libraries': [library], 
                    'language': book_in_db.language,
                    'categories': book_in_db.categories,
                    'year': book_in_db.year
                }
                books_to_store.append(book_in_db)
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
                            value[i] = value[i].removesuffix(',')
                    if 'Kategorie' in key:
                        categories = []
                        value_list = info.select('span a')
                        for item in value_list:
                            item_id = item.get('href').split('-')[1]
                            category = session.query(Category).filter(Category.id == item_id).first()
                            categories.append(category)
                        attributes[key] = categories
                    else: attributes[key] = value

                title = title
                author = attributes['Autor*in']
                year = attributes['Jahr']
                language = attributes['Sprache']
                publisher = attributes['Verlag']
                isbn = attributes['ISBN']

                category = attributes['Kategorie']
            
                book_data = {
                    'id': id,
                    'title': title,
                    'author': author,
                    'publisher': publisher,
                    'isbn': isbn,
                    'libraries': [library], 
                    'language': language,
                    'categories': category,
                    'year': year
                }
                books_to_store.append(book_data)
        store_books(books_to_store, session)
        
        print(f"Processed page {page}, found {len(books_on_page)} books")
        page += 1

    # for book in all_books:
    #     book_id = book['id']
    #     book_in_db = session.query(Book).filter(Book.id == book_id).first()

    #     if book_in_db:
    #         print(f"Book {book_in_db.title} already in database")
    #         book_data = {
    #             'id': book_in_db.id,
    #             'title': book_in_db.title,
    #             'author': book_in_db.author,
    #             'publisher': book_in_db.publisher,
    #             'isbn': book_in_db.isbn,
    #             'libraries': [library], 
    #             'language': book_in_db.language,
    #             'categories': book_in_db.categories,
    #             'year': book_in_db.year
    #         }
    #         books_to_store.append(book_in_db)
    #         continue
    #     else:
    #         response = requests.get(book['link'])
    #         soup = BeautifulSoup(response.text, 'html.parser')

    #         attributes = {}
    #         titleInfos = soup.select('.horizontalDescription')
    #         for info in titleInfos:
    #             key = info.select_one('b').text.strip().removesuffix(':')
    #             value = info.select_one('span').text.strip().split('\n')
    #             if len(value) == 1:
    #                 value = value[0]
    #             else:
    #                 for i in range(len(value)):
    #                     value[i] = value[i].removesuffix(',')
    #             if 'Kategorie' in key:
    #                 categories = []
    #                 value_list = info.select('span a')
    #                 for item in value_list:
    #                     item_id = item.get('href').split('-')[1]
    #                     category = session.query(Category).filter(Category.id == item_id).first()
    #                     categories.append(category)
    #                 attributes[key] = categories
    #             else: attributes[key] = value

    #         title = book['title']
    #         author = attributes['Autor*in']
    #         year = attributes['Jahr']
    #         language = attributes['Sprache']
    #         publisher = attributes['Verlag']
    #         isbn = attributes['ISBN']

    #         category = attributes['Kategorie']
        

    #         book_data = {
    #             'id': book['id'],
    #             'title': title,
    #             'author': author,
    #             'publisher': publisher,
    #             'isbn': isbn,
    #             'libraries': [library], 
    #             'language': language,
    #             'categories': category,
    #             'year': year
    #         }
    #         books_to_store.append(book_data)

    