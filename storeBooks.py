from models import Book  # Importiere die Modelle und Session aus models.py
import logging

# Configure logging
logging.basicConfig(filename='scraper.log', level=logging.INFO, format='%(asctime)s - %(message)s')

def store_books(book_list, Session):
    for book in book_list:
        store_book(book, Session)


def store_book(book, Session):
    session = Session()
    try:
        new_book = Book(**book)
        session.merge(new_book)
        session.commit()
    except Exception as e:
        logging.error(f"Error storing book {book['title']}: {e}")
        session.rollback()
    finally:
        session.close()