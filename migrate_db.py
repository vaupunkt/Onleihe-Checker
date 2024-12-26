from sqlalchemy import create_engine
from models import Base, Library, Book, Category
import pandas as pd
import MySQLdb

def migrate_database():
    try:
        # Source SQLite connection
        sqlite_engine = create_engine('sqlite:///onleihe_books.db')
        
        # Target MySQL connection with proper connector
        mysql_engine = create_engine(
            'mysql+mysqldb://root:supersecret@localhost/onleihe_db',
            pool_recycle=3600,
            pool_size=10
        )
        
        # Create all tables in MySQL
        Base.metadata.create_all(mysql_engine)
        
        # Migrate each table
        tables = ['libraries', 'books', 'categories', 'book_category', 'book_library']
        
        for table in tables:
            try:
                df = pd.read_sql_table(table, sqlite_engine)
                df.to_sql(table, mysql_engine, if_exists='append', index=False)
                print(f"Migrated {len(df)} rows from {table}")
                
            except Exception as e:
                print(f"Error migrating {table}: {e}")
                
    except Exception as e:
        print(f"Database connection error: {e}")

if __name__ == "__main__":
    migrate_database()