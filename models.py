from sqlalchemy import create_engine, Column, Integer, String, DateTime, func
from sqlalchemy.orm import declarative_base, sessionmaker
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

Session = sessionmaker(bind=engine)

session = Session()

class Book(Base):
    __tablename__ = 'books'
    id = Column(String(20), primary_key=True)
    title = Column(String(255), nullable=False)
    author = Column(Text)
    publisher = Column(String(255))
    language = Column(String(50))
    year = Column(String(4))
    isbn = Column(String(13))
    category_ids = Column(Text)  # Store as Text for MySQL compatibility
    library_ids = Column(Text)   # Store as Text for MySQL compatibility
    link = Column(Text)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    

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