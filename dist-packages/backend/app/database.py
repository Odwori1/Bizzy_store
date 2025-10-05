import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from app.models.base import Base
from dotenv import load_dotenv  # ← ADD THIS IMPORT

# Load environment variables from .env file
load_dotenv()  # ← ADD THIS LINE

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")  # ← UPDATE THIS LINE

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Base.metadata.create_all(bind=engine)
    pass
