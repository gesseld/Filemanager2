from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import sys
import os
from sqlalchemy.dialects.postgresql import dialect as postgresql_dialect

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import your models and Base
from models.file import File
from models.content_extraction import ExtractedContent, SearchIndex, ExtractionTask
from config import Base

# This is the Alembic Config object
config = context.config

# Set up SQLAlchemy engine
target_metadata = Base.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    # Use environment variable for database URL if available
    database_url = os.getenv("SQLALCHEMY_DATABASE_URL")
    if database_url:
        config.set_main_option("sqlalchemy.url", database_url)

    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Enable PostgreSQL-specific features
            dialect_opts={
                "postgresql": {
                    "use_native_unicode": True,
                    "server_side_cursors": False,
                }
            },
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
