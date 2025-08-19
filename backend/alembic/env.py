from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.models.base import Base
import os
import sys
from dotenv import load_dotenv  # ← ADD THIS IMPORT

# Load environment variables
load_dotenv()  # ← ADD THIS LINE

# Set absolute path to backend directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

# Import all models (required for autogenerate)
from app.models.user import User
from app.models.product import Product
from app.models.inventory import InventoryHistory
target_metadata = Base.metadata

# Standard Alembic setup
config = context.config

# Get database URL from environment
db_url = os.getenv("DATABASE_URL")
if db_url:
    config.set_main_option("sqlalchemy.url", db_url)  # ← ADD THIS LINE

fileConfig(config.config_file_name)

# ... rest of the file remains the same ...

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
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
