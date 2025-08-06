from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from config import SessionLocal
from models.file import File
from models.content_extraction import ExtractedContent, ExtractionTask, SearchIndex
from schemas.content_extraction import (
    ExtractedContentResponse,
    SearchRequest,
    SearchResponse,
    ExtractionTaskResponse,
    ContentExtractionRequest,
)
from tasks.content_extraction import extract_content
from services.monitoring_service import MonitoringService

router = APIRouter(prefix="/api/content", tags=["content"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/extract", response_model=ExtractionTaskResponse)
async def trigger_content_extraction(
    request: ContentExtractionRequest, db: Session = Depends(get_db)
):
    """Trigger content extraction for a file"""
    # Check if file exists
    file = db.query(File).filter(File.id == request.file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Check if extraction already exists and skip if not forcing re-extraction
    if not request.force_reextract:
        existing_content = (
            db.query(ExtractedContent).filter(ExtractedContent.file_id == request.file_id).first()
        )

        if existing_content and existing_content.extraction_status == "completed":
            # Return existing task
            task = (
                db.query(ExtractionTask)
                .filter(ExtractionTask.file_id == request.file_id)
                .order_by(ExtractionTask.created_at.desc())
                .first()
            )

            if task:
                return task

    # Create new extraction task
    task_id = str(uuid.uuid4())
    extraction_task = ExtractionTask(file_id=request.file_id, task_id=task_id, status="pending")
    db.add(extraction_task)

    # Create or update extracted content record
    extracted_content = (
        db.query(ExtractedContent).filter(ExtractedContent.file_id == request.file_id).first()
    )

    if extracted_content:
        extracted_content.extraction_status = "pending"
        extracted_content.error_message = None
    else:
        extracted_content = ExtractedContent(file_id=request.file_id, extraction_status="pending")
        db.add(extracted_content)

    db.commit()

    # Trigger async extraction
    extract_content.delay(request.file_id, task_id)

    return extraction_task


@router.get("/extract/{file_id}", response_model=ExtractedContentResponse)
async def get_extracted_content(file_id: int, db: Session = Depends(get_db)):
    """Get extracted content for a file"""
    content = db.query(ExtractedContent).filter(ExtractedContent.file_id == file_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    return content


@router.post("/search", response_model=SearchResponse)
async def search_content(search_request: SearchRequest, db: Session = Depends(get_db)):
    """Search for content using full-text search"""
    # PostgreSQL full-text search query
    search_query = f"""
    SELECT 
        si.file_id,
        f.name as file_name,
        si.content,
        ts_rank(to_tsvector('english', si.content), plainto_tsquery('english', :query)) as score
    FROM search_index si
    JOIN files f ON si.file_id = f.id
    WHERE to_tsvector('english', si.content) @@ plainto_tsquery('english', :query)
    ORDER BY score DESC
    LIMIT :limit OFFSET :offset
    """

    # Count total results
    count_query = """
    SELECT COUNT(*) 
    FROM search_index si
    WHERE to_tsvector('english', si.content) @@ plainto_tsquery('english', :query)
    """

    total = db.execute(count_query, {"query": search_request.query}).scalar()

    results = db.execute(
        search_query,
        {
            "query": search_request.query,
            "limit": search_request.limit,
            "offset": search_request.offset,
        },
    ).fetchall()

    # Convert results to response format
    search_results = [
        {
            "file_id": row.file_id,
            "file_name": row.file_name,
            "content": row.content[:500] + "..." if len(row.content) > 500 else row.content,
            "score": float(row.score),
        }
        for row in results
    ]

    return SearchResponse(
        results=search_results,
        total=total,
        query=search_request.query,
        limit=search_request.limit,
        offset=search_request.offset,
    )


@router.get("/search", response_model=SearchResponse)
async def search_content_get(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Search for content using GET request"""
    search_request = SearchRequest(query=q, limit=limit, offset=offset)
    return await search_content(search_request, db)


@router.get("/tasks/{task_id}", response_model=ExtractionTaskResponse)
async def get_extraction_task(task_id: str, db: Session = Depends(get_db)):
    """Get extraction task status"""
    task = db.query(ExtractionTask).filter(ExtractionTask.task_id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


@router.get("/tasks", response_model=List[ExtractionTaskResponse])
async def list_extraction_tasks(
    file_id: Optional[int] = Query(None, description="Filter by file ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List extraction tasks"""
    query = db.query(ExtractionTask)

    if file_id:
        query = query.filter(ExtractionTask.file_id == file_id)

    if status:
        query = query.filter(ExtractionTask.status == status)

    tasks = query.order_by(ExtractionTask.created_at.desc()).offset(offset).limit(limit).all()

    return tasks


@router.delete("/extract/{file_id}")
async def delete_extracted_content(file_id: int, db: Session = Depends(get_db)):
    """Delete extracted content for a file"""
    content = db.query(ExtractedContent).filter(ExtractedContent.file_id == file_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    db.delete(content)

    # Also delete search index
    search_index = db.query(SearchIndex).filter(SearchIndex.file_id == file_id).first()

    if search_index:
        db.delete(search_index)

    db.commit()

    return {"message": "Content deleted successfully"}


@router.get("/monitoring/stats")
async def get_monitoring_stats():
    """Get comprehensive task statistics"""
    monitoring = MonitoringService()
    try:
        stats = monitoring.get_task_statistics()
        return stats
    finally:
        monitoring.close()


@router.get("/monitoring/health")
async def get_system_health():
    """Get system health status"""
    monitoring = MonitoringService()
    try:
        health = monitoring.get_system_health()
        return health
    finally:
        monitoring.close()


@router.get("/monitoring/failed-tasks")
async def get_failed_tasks(limit: int = Query(50, ge=1, le=100)):
    """Get list of failed tasks"""
    monitoring = MonitoringService()
    try:
        failed_tasks = monitoring.get_failed_tasks(limit)
        return {"failed_tasks": failed_tasks}
    finally:
        monitoring.close()


@router.get("/monitoring/pending-tasks")
async def get_pending_tasks():
    """Get list of pending tasks"""
    monitoring = MonitoringService()
    try:
        pending_tasks = monitoring.get_pending_tasks()
        return {"pending_tasks": pending_tasks}
    finally:
        monitoring.close()


@router.get("/monitoring/processing-tasks")
async def get_processing_tasks():
    """Get list of currently processing tasks"""
    monitoring = MonitoringService()
    try:
        processing_tasks = monitoring.get_processing_tasks()
        return {"processing_tasks": processing_tasks}
    finally:
        monitoring.close()


@router.post("/monitoring/cleanup")
async def cleanup_old_tasks(days: int = Query(7, ge=1, le=30, description="Days to keep tasks")):
    """Clean up old completed/failed tasks"""
    monitoring = MonitoringService()
    try:
        result = monitoring.cleanup_old_tasks(days)
        return result
    finally:
        monitoring.close()
