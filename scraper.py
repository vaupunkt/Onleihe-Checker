from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from storeToDB.storeBooks import store_books
from storeToDB.storeCategories import store_categories
from scrapeFunctions.getBooks import get_books
from scrapeFunctions.getCategories import get_categories
from scrapeFunctions.getLibraries import get_libraries
from storeToDB.storeLibraries import store_libraries
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

    books = get_books(library,Session, session)

except Exception as e:
    print(f"Database error: {e}")
finally:
    session.close()
