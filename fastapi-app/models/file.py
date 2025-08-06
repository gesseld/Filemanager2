from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from config import Base
import uuid


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    path = Column(String(500), nullable=False)
    size = Column(Integer, nullable=False)
    type = Column(String(100), nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    extracted_content = relationship("ExtractedContent", back_populates="file", uselist=False)
    search_index = relationship("SearchIndex", back_populates="file", uselist=False)
    extraction_tasks = relationship("ExtractionTask", back_populates="file")

    # PostgreSQL indexes for better performance
    __table_args__ = (
        Index("idx_file_type", "type"),
        Index("idx_file_upload_date", "upload_date"),
    )
