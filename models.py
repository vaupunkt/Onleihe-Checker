from sqlalchemy import create_engine, Column, Integer, String, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import Table, ForeignKey

# Datenbankverbindung
engine = create_engine('sqlite:///onleihe_books.db')
Base = declarative_base()


# Association tables for many-to-many relationships
book_category_association = Table('book_category', Base.metadata,
    Column('book_id', Integer, ForeignKey('books.id')),
    Column('category_id', Integer, ForeignKey('categories.id'))
)

book_library_association = Table('book_library', Base.metadata,
    Column('book_id', Integer, ForeignKey('books.id')),
    Column('library_id', Integer, ForeignKey('libraries.id'))
)

# Book Model
class Book(Base):
    __tablename__ = 'books'
    id = Column(Integer, primary_key=True)
    title = Column(String)
    author = Column(String)
    publisher = Column(String)
    language = Column(String)
    year = Column(Integer)
    isbn = Column(String)
    category_ids = Column(String)  # Store as comma-separated string
    library_ids = Column(String)   # Store as comma-separated string
    categories = relationship('Category', secondary=book_category_association, back_populates='books')
    libraries = relationship('Library', secondary=book_library_association, back_populates='books')
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Category Model
class Category(Base):
    __tablename__ = 'categories'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    link = Column(String)
    books = relationship('Book', secondary=book_category_association, back_populates='categories')
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Library Model
class Library(Base):
    __tablename__ = 'libraries'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    baseURL = Column(String)
    country = Column(String)
    books = relationship('Book', secondary=book_library_association, back_populates='libraries')
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())



# Tabellen erstellen
Base.metadata.create_all(engine)

# Session erstellen
Session = sessionmaker(bind=engine)
session = Session()