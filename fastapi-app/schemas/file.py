from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class FileBase(BaseModel):
    name: str
    path: str
    size: int
    type: str


class FileCreate(FileBase):
    pass


class FileUpdate(BaseModel):
    name: Optional[str] = None
    path: Optional[str] = None
    size: Optional[int] = None
    type: Optional[str] = None


class File(FileBase):
    id: int
    upload_date: datetime

    class Config:
        from_attributes = True


class PaginatedFiles(BaseModel):
    items: list[File]
    total: int
    page: int
    per_page: int
    total_pages: int
