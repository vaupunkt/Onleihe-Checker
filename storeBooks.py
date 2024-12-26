from models import Book  # Importiere die Modelle und Session aus models.py

def store_books(book_list, Session):
    for book in book_list:
        store_book(book, Session)


def store_book(book, Session):
    session = Session()
    try:
        new_book = Book(
            id=book['id'],
            title=book['title'],
            author=book['author'],
            publisher=book['publisher'],
            language=book['language'],
            year=book['year'],
            isbn=book['isbn'],
            category_ids=book['category_ids'],
            library_ids=book['library_ids'],
            link=book['link']
        )
        session.merge(new_book)
        session.commit()
    finally:
        session.close()