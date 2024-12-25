from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from storeCategories import store_categories
from getBooks import get_books
from getCategories import get_categories
from getLibraries import get_libraries
from storeLibraries import store_libraries
from models import Library

# Database setup
engine = create_engine('sqlite:///onleihe_books.db')
Base = declarative_base()
Session = sessionmaker(bind=engine)

libraries = get_libraries()
store_libraries(libraries, Session)

session = Session()
try:
    # Get first library from database
    library = session.query(Library).filter(Library.name == 'Greifswald').first()
    categories = get_categories(library)
    store_categories(categories, Session)

    books = get_books(library, session, Session)

except Exception as e:
    print(f"Database error: {e}")
finally:
    session.close()
