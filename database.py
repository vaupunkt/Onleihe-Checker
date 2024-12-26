from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

engine = create_engine(
    'mysql+pymysql://root:supersecret@localhost:3306/onleihe_db',
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20
)
Base = declarative_base()

# Create the books table
Base.metadata.create_all(engine)

# Create a session to interact with the database
Session = sessionmaker(bind=engine)
session = Session()