"""Database setup: the SQLite engine, a session factory, and the ORM Base.

Everything that talks to the database goes through here:
- `engine`        : the live connection to the SQLite file
- `SessionLocal`  : a factory that hands out short-lived DB sessions
- `Base`          : the parent class every ORM model (table) inherits from
- `get_db()`      : a FastAPI dependency that opens a session per request
"""
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# The SQLite database is a single file living at backend/route53.db.
# Using an absolute path means it does not matter which folder the server is
# started from — it always finds the same database file.
DB_PATH = Path(__file__).resolve().parent.parent / "route53.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# check_same_thread=False is required for SQLite under FastAPI, because FastAPI
# may handle requests on different threads than the one that created the engine.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# A "session" is one unit of conversation with the database. SessionLocal is a
# factory: call it to get a fresh session. autoflush/autocommit are off so we
# control exactly when changes are written and committed.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base records every model class that subclasses it, so SQLAlchemy knows the
# full set of tables to create.
Base = declarative_base()


def get_db():
    """FastAPI dependency: yield a DB session and always close it afterwards.

    Used like:  def endpoint(db: Session = Depends(get_db)): ...
    The try/finally guarantees the session is returned even if the request errors.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
