from sqlalchemy import create_engine, Column, Integer, String, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
import json

# Datenbankverbindung
engine = create_engine(
    'mysql+pymysql://root:supersecret@localhost:3306/onleihe_db',
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20
)

Base = declarative_base()

class Book(Base):
    __tablename__ = 'books'
    id = Column(String(20), primary_key=True)
    title = Column(String(255), nullable=False)
    author = Column(Text)  # Will store JSON string of authors
    publisher = Column(String(255))
    language = Column(String(50))
    year = Column(String(4))
    isbn = Column(String(13))
    category_ids = Column(Text)  # Will store comma-separated IDs
    library_ids = Column(Text)  # Will store comma-separated IDs
    link = Column(Text)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def __init__(self, **kwargs):
        # Convert lists to strings for storage
        if 'author' in kwargs and isinstance(kwargs['author'], list):
            kwargs['author'] = json.dumps(kwargs['author'])
        if 'category_ids' in kwargs and isinstance(kwargs['category_ids'], list):
            kwargs['category_ids'] = ','.join(map(str, kwargs['category_ids']))
        if 'library_ids' in kwargs and not isinstance(kwargs['library_ids'], str):
            kwargs['library_ids'] = str(kwargs['library_ids'])
        super(Book, self).__init__(**kwargs)

class Category(Base):
    __tablename__ = 'categories'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    link = Column(String(512))
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Library(Base):
    __tablename__ = 'libraries'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    baseURL = Column(String(512))
    country = Column(String(100))
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())