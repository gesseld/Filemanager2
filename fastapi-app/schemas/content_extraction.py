from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class ExtractedContentResponse(BaseModel):
    id: int
    file_id: int
    content: Optional[str]
    metadata: Optional[Dict[str, Any]]
    extraction_status: str
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SearchResult(BaseModel):
    file_id: int
    file_name: str
    content: Optional[str]
    score: float

    class Config:
        from_attributes = True


class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 10
    offset: Optional[int] = 0


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
    query: str
    limit: int
    offset: int


class ExtractionTaskResponse(BaseModel):
    id: int
    file_id: int
    task_id: str
    status: str
    retry_count: int
    max_retries: int
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ContentExtractionRequest(BaseModel):
    file_id: int
    force_reextract: bool = False
