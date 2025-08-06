from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import TSVECTOR, JSONB
from sqlalchemy.orm import relationship
from config import Base


class ExtractedContent(Base):
    __tablename__ = "extracted_content"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False, unique=True)
    content = Column(Text)
    file_metadata = Column(JSONB, name="metadata")  # PostgreSQL JSONB for better performance
    extraction_status = Column(String(20), default="pending")  # pending, processing, completed, failed
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    file = relationship("File", back_populates="extracted_content")

    # PostgreSQL indexes
    __table_args__ = (
        Index("idx_extracted_content_status", "extraction_status"),
        Index("idx_extracted_content_created_at", "created_at"),
    )


class SearchIndex(Base):
    __tablename__ = "search_index"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False, unique=True)
    content = Column(Text)
    search_vector = Column(TSVECTOR)  # PostgreSQL TSVECTOR for full-text search
    indexed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    file = relationship("File", back_populates="search_index")

    # PostgreSQL indexes
    __table_args__ = (
        Index("idx_search_vector", "search_vector", postgresql_using="gin"),
        Index("idx_search_index_file_id", "file_id", unique=True),
    )


class ExtractionTask(Base):
    __tablename__ = "extraction_tasks"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    task_id = Column(String(255), unique=True, index=True)  # Celery task ID
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    error_message = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    file = relationship("File", back_populates="extraction_tasks")

    # PostgreSQL indexes
    __table_args__ = (
        Index("idx_extraction_task_status", "status"),
        Index("idx_extraction_task_task_id", "task_id", unique=True),
        Index("idx_extraction_task_file_id", "file_id"),
    )
