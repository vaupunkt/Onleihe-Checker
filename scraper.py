import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from contextlib import contextmanager
from storeCategories import store_categories
from getBooks import get_books
from getCategories import get_categories
from getLibraries import get_libraries
from storeLibraries import store_libraries
from models import Library
from datetime import datetime

# Configure logging
logging.basicConfig(filename="scraper.log",level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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
        logging.error(f"Session rollback due to: {e}")
        raise e
    finally:
        session.close()

def should_skip_fetch(last_log, threshold_seconds=24*3600):
    if last_log:
        last_time = datetime.strptime(last_log, "%Y-%m-%d %H:%M:%S,%f")
        if (datetime.now() - last_time).total_seconds() < threshold_seconds:
            return True
    return False

def fetch_and_store_libraries(session):
    logging.info("Fetching libraries...")
    libraries = get_libraries()
    logging.info("Storing libraries to db...")
    store_libraries(libraries, session)

def fetch_and_store_categories_and_books(library, session):
    logging.info(f"Fetching categories for library: {library.name} - {library.id}")
    categories = get_categories(library)
    logging.info("Storing categories...")
    store_categories(categories, Session)
    logging.info(f"Categories stored for library: {library.name} - {library.id}")
    logging.info("Fetching books...")
    get_books(library, session, Session)

def main():
    try:
        logging.info("Starting the main function")
        last_log = None
        with open("scraper.log", "r") as f:
            for line in f:
                if "Fetching libraries..." in line:
                    last_log = line.split(" - ")[0]

        with session_scope() as session:
            if should_skip_fetch(last_log):
                logging.info("Skipping libraries fetch - last fetch within 24 hours")
            else:
                fetch_and_store_libraries(session)
            
            libraries = session.query(Library).all()
            for library in libraries:
                last_category_store = None
                with open("scraper.log", "r") as f:
                    for line in f:
                        if "Storing categories..." in line:
                            last_category_store = line.split(" - ")[0]
                if should_skip_fetch(last_category_store):
                    logging.info("Skipping categories fetch - last fetch within 24 hours")
                    get_books(library, session, Session)
                else:
                    fetch_and_store_categories_and_books(library, session)
    except Exception as e:
        logging.error(f"Database error: {e}")

if __name__ == "__main__":
    logging.info("Script started")
    main()
    logging.info("Script finished")