from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging
from typing import Optional


class Settings:
    # Database configuration
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "filemanager")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "postgres")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    DATABASE_URL: str = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    SQLALCHEMY_DATABASE_URL: str = os.getenv("SQLALCHEMY_DATABASE_URL", DATABASE_URL)

    # Logging configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "json")

    # Redis configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")

    # Tika configuration
    TIKA_SERVER_URL: str = os.getenv("TIKA_SERVER_URL", "http://tika:9998/tika")

    # AI Services Configuration
    AI_SUMMARIZATION_URL: str = os.getenv("AI_SUMMARIZATION_URL", "http://ai-summarization:8002")
    AI_SUMMARIZATION_TIMEOUT: int = int(os.getenv("AI_SUMMARIZATION_TIMEOUT", "30"))
    AI_SUMMARIZATION_API_KEY: Optional[str] = os.getenv("AI_SUMMARIZATION_API_KEY")
    AI_SUMMARIZATION_MAX_RETRIES: int = int(os.getenv("AI_SUMMARIZATION_MAX_RETRIES", "3"))
    
    AUTO_TAGGING_URL: str = os.getenv("AUTO_TAGGING_URL", "http://auto-tagging:8001")
    AUTO_TAGGING_TIMEOUT: int = int(os.getenv("AUTO_TAGGING_TIMEOUT", "30"))
    AUTO_TAGGING_API_KEY: Optional[str] = os.getenv("AUTO_TAGGING_API_KEY")
    AUTO_TAGGING_MAX_RETRIES: int = int(os.getenv("AUTO_TAGGING_MAX_RETRIES", "3"))
    
    # Circuit Breaker Settings
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: int = int(os.getenv("CIRCUIT_BREAKER_FAILURE_THRESHOLD", "3"))
    CIRCUIT_BREAKER_RECOVERY_TIMEOUT: int = int(os.getenv("CIRCUIT_BREAKER_RECOVERY_TIMEOUT", "60"))

    # Embeddings Configuration
    EMBEDDINGS_MODEL: str = os.getenv("EMBEDDINGS_MODEL", "all-MiniLM-L6-v2")
    EMBEDDINGS_INDEX_PATH: str = os.getenv("EMBEDDINGS_INDEX_PATH", "embeddings.index")
    EMBEDDINGS_BATCH_SIZE: int = int(os.getenv("EMBEDDINGS_BATCH_SIZE", "32"))


# Configure basic logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

settings = Settings()

# PostgreSQL database configuration
SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    # PostgreSQL-specific connection arguments
    connect_args={"connect_timeout": 10, "options": "-c timezone=utc"},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
