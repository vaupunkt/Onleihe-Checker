from models import Book  # Importiere die Modelle und Session aus models.py

def store_books(book_list, Session):
    session = Session()
    try:
        for book in book_list:
            # Get IDs as comma-separated strings
            category_ids = ','.join([str(cat.id) for cat in book['categories']]) if book['categories'] else ''
            library_ids = ','.join([str(lib.id) for lib in book['libraries']]) if book['libraries'] else ''
            
            new_book = Book(
                id=book['isbn'],
                title=book['title'],
                author=book['author'],
                publisher=book['publisher'],
                language=book['language'],
                year=book['year'],
                isbn=book['isbn'],
                category_ids=category_ids,
                library_ids=library_ids
            )
            new_book.libraries.extend(book['libraries'])
            new_book.categories.extend(book['categories'])
            session.merge(new_book)
        session.commit()
    finally:
        session.close()