from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from contextlib import contextmanager
from storeCategories import store_categories
from getBooks import get_books
from getCategories import get_categories
from getLibraries import get_libraries
from storeLibraries import store_libraries
from models import Library

# Database setup
engine = create_engine(
    'mysql+pymysql://root:supersecret@localhost:3306/onleihe_db',
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20
)

Base = declarative_base()
Session = sessionmaker(bind=engine)

@contextmanager
def session_scope():
    session = Session()
    session.autoflush = False
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def main():
    try:
        # libraries = get_libraries()
        
        with session_scope() as session:
            # store_libraries(libraries, session)
            
            library = session.query(Library).filter(Library.name == 'Erfurt').first()
            if library:
                # categories = get_categories(library)
                # store_categories(categories, Session)
                books = get_books(library, session, Session)
                
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    main()