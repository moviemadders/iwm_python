import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
from pathlib import Path
import sys

# Ensure repository root is on sys.path so we can import app modules
# Ensure repository root is on sys.path so we can import app modules
# _repo_root = Path(__file__).resolve().parents[3]
# if str(_repo_root) not in sys.path:
#     sys.path.append(str(_repo_root))

from src.config import settings  # type: ignore
from src.db import Base  # type: ignore
from src import models  # noqa: F401  # ensure models are imported for autogenerate

target_metadata = Base.metadata

# Override sqlalchemy.url from settings (preferred)
if getattr(settings, "database_url", None):
    config.set_main_option("sqlalchemy.url", settings.database_url)

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

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


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section, {})
    
    # Handle SSL for asyncpg if needed
    connect_args = {}
    url = configuration.get("sqlalchemy.url", "")
    
    # Check for sslmode in URL (common in Neon/Render connection strings)
    if "sslmode" in url or "neon.tech" in url:
        import ssl
        
        # Create SSL context
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        connect_args["ssl"] = ssl_context
        
        # asyncpg doesn't support sslmode in URL, so we need to strip it
        if "sslmode=" in url:
            # Simple string replacement to remove sslmode param
            # Handles ?sslmode=... and &sslmode=...
            import re
            url = re.sub(r'[?&]sslmode=[^&]+', '', url)
            # If we removed the ? but there are other params, make sure the first one has ?
            if "?" not in url and "&" in url:
                url = url.replace("&", "?", 1)
            
            # Update the URL in configuration
            configuration["sqlalchemy.url"] = url

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
