from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Index, Float, Text, ForeignKey, Boolean, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from config import Base
import uuid
import pickle
import numpy as np


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    path = Column(String(500), nullable=False)
    size = Column(Integer, nullable=False)
    type = Column(String(100), nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    summary = Column(Text, nullable=True)
    last_processed_at = Column(DateTime, nullable=True)
    processing_status = Column(String(20), nullable=True)  # 'pending', 'processing', 'completed', 'failed'
    processing_model = Column(String(50), nullable=True)  # Model used for processing
    has_embeddings = Column(Boolean, default=False, nullable=False)

    # Relationships
    extracted_content = relationship("ExtractedContent", back_populates="file", uselist=False)
    search_index = relationship("SearchIndex", back_populates="file", uselist=False)
    extraction_tasks = relationship("ExtractionTask", back_populates="file")
    embeddings = relationship("FileEmbedding", back_populates="file", uselist=False)
    tags = relationship(
        "Tag",
        secondary="file_tags",
        back_populates="files"
    )

    # PostgreSQL indexes for better performance
    __table_args__ = (
        Index("idx_file_type", "type"),
        Index("idx_file_upload_date", "upload_date"),
        Index("idx_file_processing_status", "processing_status"),
        Index("idx_file_has_embeddings", "has_embeddings"),
    )

    def get_embedding(self) -> Optional[np.ndarray]:
        """Get the file's embedding vector if available"""
        if not self.embeddings:
            return None
        return pickle.loads(self.embeddings.embedding)


class FileEmbedding(Base):
    __tablename__ = "file_embeddings"

    id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey("files.id"))
    embedding = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    file = relationship("File", back_populates="embeddings")

    __table_args__ = (
        Index("idx_file_embedding_file_id", "file_id"),
    )


class AITag(Base):
    __tablename__ = "ai_tags"
    
    id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey("files.id"))
    tag = Column(String(100))
    confidence = Column(Float)
    source = Column(String(50))  # 'spacy', 'gliclass', 'api'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    file = relationship("File", back_populates="ai_tags")


class AISummary(Base):
    __tablename__ = "ai_summaries"
    
    id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey("files.id"))
    summary = Column(Text)
    model = Column(String(50))  # 'llama', 'gpt', 'claude', 'deepseek'
    length = Column(String(20))  # 'short', 'medium', 'long'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    file = relationship("File", back_populates="ai_summaries")
