#!/usr/bin/env python3
"""
PostgreSQL setup and migration script for File Manager application
This script handles PostgreSQL database initialization and testing
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', 'your-secure-password'),
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'filemanager')
}

def test_postgresql_connection():
    """Test PostgreSQL connection"""
    try:
        connection_string = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
        engine = create_engine(connection_string)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()
            logger.info(f"✓ PostgreSQL connection successful: {version}")
            
            # Test if database exists
            result = conn.execute(text("SELECT current_database()"))
            current_db = result.scalar()
            logger.info(f"✓ Connected to database: {current_db}")
            
        return True
        
    except Exception as e:
        logger.error(f"✗ PostgreSQL connection failed: {str(e)}")
        return False

def create_database_if_not_exists():
    """Create database if it doesn't exist"""
    try:
        # Connect to PostgreSQL server
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database='postgres'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (DB_CONFIG['database'],)
        )
        
        if cursor.fetchone():
            logger.info(f"✓ Database '{DB_CONFIG['database']}' already exists")
        else:
            cursor.execute(f"CREATE DATABASE {DB_CONFIG['database']}")
            logger.info(f"✓ Database '{DB_CONFIG['database']}' created successfully")
            
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"✗ Database creation failed: {str(e)}")
        return False

def setup_postgresql_extensions():
    """Setup PostgreSQL extensions for full-text search"""
    try:
        connection_string = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
        engine = create_engine(connection_string)
        
        with engine.connect() as conn:
            # Create extensions
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS unaccent"))
            conn.commit()
            logger.info("✓ PostgreSQL extensions created successfully")
            
        return True
        
    except Exception as e:
        logger.error(f"✗ Extension setup failed: {str(e)}")
        return False

def run_migrations():
    """Run Alembic migrations"""
    try:
        import subprocess
        import os
        
        # Change to fastapi-app directory
        os.chdir('fastapi-app')
        
        # Run migrations
        result = subprocess.run(
            ['alembic', 'upgrade', 'head'],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            logger.info("✓ Migrations completed successfully")
            logger.info(result.stdout)
        else:
            logger.error(f"✗ Migration failed: {result.stderr}")
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"✗ Migration execution failed: {str(e)}")
        return False

def test_full_text_search():
    """Test PostgreSQL full-text search functionality"""
    try:
        connection_string = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
        engine = create_engine(connection_string)
        
        with engine.connect() as conn:
            # Test full-text search
            test_query = "SELECT to_tsvector('english', 'This is a test document for full-text search')"
            result = conn.execute(text(test_query))
            ts_vector = result.scalar()
            logger.info(f"✓ Full-text search test: {ts_vector}")
            
            # Test GIN index creation
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS test_search (
                    id SERIAL PRIMARY KEY,
                    content TEXT,
                    search_vector TSVECTOR
                )
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_test_search_vector 
                ON test_search USING GIN(search_vector)
            """))
            
            conn.execute(text("DROP TABLE IF EXISTS test_search"))
            conn.commit()
            logger.info("✓ Full-text search indexes tested successfully")
            
        return True
        
    except Exception as e:
        logger.error(f"✗ Full-text search test failed: {str(e)}")
        return False

def main():
    """Main setup function"""
    logger.info("Starting PostgreSQL setup for File Manager...")
    
    steps = [
        ("Creating database", create_database_if_not_exists),
        ("Testing connection", test_postgresql_connection),
        ("Setting up extensions", setup_postgresql_extensions),
        ("Testing full-text search", test_full_text_search),
        ("Running migrations", run_migrations),
    ]
    
    success = True
    for step_name, step_func in steps:
        logger.info(f"\n--- {step_name} ---")
        if not step_func():
            success = False
            break
    
    if success:
        logger.info("\n✅ PostgreSQL setup completed successfully!")
        logger.info("\nYour application is now configured to use PostgreSQL with:")
        logger.info("- Full-text search capabilities")
        logger.info("- Optimized indexes for performance")
        logger.info("- PostgreSQL-specific data types (JSONB, TSVECTOR)")
        logger.info("- Proper connection pooling")
    else:
        logger.error("\n❌ PostgreSQL setup failed. Please check the logs above.")
        sys.exit(1)

if __name__ == "__main__":
    main()