# ─────────────────────────────────────────────────────────────────────────────
# alembic/env.py
#
# Alembic configuration file — tells Alembic how to connect to the database
# and where to find the SQLAlchemy models (so it can auto-generate migrations).
#
# KEY CONCEPT — autogenerate:
#   When you run `alembic revision --autogenerate`, Alembic:
#     1. Reads your SQLAlchemy models via Base.metadata
#     2. Compares them to the current database schema
#     3. Generates a migration script with the differences (new tables, columns, etc.)
# ─────────────────────────────────────────────────────────────────────────────

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Make sure 'app' package is importable ─────────────────────────────────────
# This adds the project root to sys.path so `from app.xxx import yyy` works.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── Load app settings (reads .env) ───────────────────────────────────────────
from app.core.config import settings

# ── Import Base and ALL models ────────────────────────────────────────────────
# Importing models here ensures Base.metadata knows about every table.
# Without this, autogenerate would produce empty migration files.
from app.database import Base
import app.models  # noqa: F401 — triggers all model imports via models/__init__.py

# ── Alembic Config ────────────────────────────────────────────────────────────
config = context.config

# Override the sqlalchemy.url from alembic.ini with the value from .env
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Set up Python logging from the alembic.ini [loggers] section
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# This is the metadata object that autogenerate inspects
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode — generates SQL scripts without
    connecting to the database.  Useful for reviewing what SQL will be run.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode — connects to the database and applies
    the migration immediately.  This is what `alembic upgrade head` uses.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


# Run offline or online based on how Alembic was invoked
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
