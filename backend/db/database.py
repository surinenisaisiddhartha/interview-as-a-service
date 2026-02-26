import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:password@localhost:5432/ai_recruitment"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # Detect stale connections
    pool_size=10,
    max_overflow=20,
    echo=False,               # Set True for SQL query logging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependency-injectable DB session (for FastAPI routes)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
