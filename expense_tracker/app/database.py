# ─────────────────────────────────────────────────────────────────────────────
# app/database.py
#
# This file sets up the SQLAlchemy connection to MySQL.
#
# Key concepts:
#   Engine      — the low-level connection pool to the database
#   SessionLocal — a factory that creates new database sessions
#   Base        — the declarative base class all our models inherit from
#
# HOW SQLAlchemy WORKS (brief):
#   1. You define Python classes (models) that inherit from Base.
#   2. SQLAlchemy maps those classes to database tables.
#   3. You use a Session to query/insert/update/delete rows.
#   4. The session tracks changes and flushes them to the DB on commit().
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
# create_engine connects to MySQL using the URL from .env.
# pool_pre_ping=True: before using a connection from the pool, ping the DB
#   to check it's still alive (handles dropped connections gracefully).
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    # echo=True,  # Uncomment to print all SQL statements (useful for debugging)
)

# ── Session factory ───────────────────────────────────────────────────────────
# sessionmaker creates a class (not an instance) configured with our engine.
# Each call to SessionLocal() produces a new, independent database session.
# autocommit=False → we must call db.commit() explicitly (safer)
# autoflush=False  → SQLAlchemy won't auto-flush before queries (more control)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Declarative Base ──────────────────────────────────────────────────────────
# All our model classes will inherit from Base.
# This links them to the engine so Alembic (migrations) can find them.
Base = declarative_base()
