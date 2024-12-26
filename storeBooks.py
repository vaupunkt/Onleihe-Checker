from models import Book  # Importiere die Modelle und Session aus models.py

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
        print(f"Error storing book {book['title']}: {e}")
        session.rollback()
    finally:
        session.close()