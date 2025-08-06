from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from config import Base

file_tag_association = Table(
    'file_tags', Base.metadata,
    Column('file_id', Integer, ForeignKey('files.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True),
    Column('created_at', DateTime, default=datetime.utcnow)
)

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    color = Column(String(7), default="#6b7280")  # Default gray color
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    files = relationship(
        "File", 
        secondary=file_tag_association,
        back_populates="tags"
    )

    def __repr__(self):
        return f"<Tag {self.name}>"