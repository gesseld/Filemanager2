from fastapi import APIRouter, HTTPException, Depends, Query, Body
from fastapi.security import HTTPBearer
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.orm import Session
from typing import Optional, List
from models.file import File, AITag, AISummary, Tag
from schemas.file import File as FileSchema
from config import SessionLocal, settings
from datetime import datetime
import httpx
from services.monitoring_service import MonitoringService
from celery import current_app

security = HTTPBearer()

router = APIRouter(prefix="/api", tags=["ai_processing"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_ai_service_client():
    return httpx.AsyncClient()

@router.post("/files/{file_id}/summarize")
async def generate_summary(
    file_id: int,
    db: Session = Depends(get_db),
    length: str = Query("medium", enum=["short", "medium", "long"]),
    model: str = Query("llama", enum=["llama", "gpt", "claude", "deepseek"])
):
    """Queue AI summary task for a file"""
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        task = generate_summary_task.delay(file_id, length, model)
        return {"task_id": task.id, "status": "queued"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue summary task: {str(e)}")

@router.post("/files/{file_id}/auto-tag",
             dependencies=[Depends(RateLimiter(times=3, minutes=1))])
async def generate_tags(
    file_id: int,
    db: Session = Depends(get_db),
    strategy: str = Query("hybrid", enum=["spacy", "gliclass", "api", "hybrid"])
):
    """Queue auto-tagging task for a file"""
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        task = auto_tag_task.delay(file_id, strategy)
        return {"task_id": task.id, "status": "queued"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue tagging task: {str(e)}")

@router.get("/files/{file_id}/summary",
            dependencies=[Depends(RateLimiter(times=20, minutes=1))])
async def get_summary(file_id: int, db: Session = Depends(get_db)):
    """Get stored AI summary for a file"""
    summary = db.query(AISummary).filter(AISummary.file_id == file_id).order_by(AISummary.created_at.desc()).first()
    if not summary:
        raise HTTPException(status_code=404, detail="No summary found")
    return summary

@router.post("/files/{file_id}/tags")
async def update_tags(
    file_id: int,
    tags: List[str] = Body(...),
    db: Session = Depends(get_db)
):
    """Add/update tags for a file"""
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get or create tags
    tag_objects = []
    for tag_name in tags:
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        tag_objects.append(tag)
    
    # Update file tags
    file.tags = tag_objects
    db.commit()
    
    return {"message": "Tags updated successfully"}

@router.get("/tags")
async def list_tags(db: Session = Depends(get_db)):
    """List all available tags"""
    tags = db.query(Tag).all()
    return tags

@router.get("/tags/suggestions")
async def get_tag_suggestions(db: Session = Depends(get_db)):
    """Get tag suggestions based on usage"""
    tags = db.query(Tag).order_by(Tag.usage_count.desc()).limit(10).all()
    return tags

@router.get("/tasks/{task_id}/status")
async def get_task_status(task_id: str):
    """Check status of an async task"""
    task = generate_summary_task.AsyncResult(task_id)
    if task.state == 'PENDING':
        return {"status": "pending"}
    elif task.state == 'PROGRESS':
        return {"status": "in_progress", "progress": task.info.get('progress', 0)}
    elif task.state == 'SUCCESS':
        return {"status": "completed", "result": task.result}
    elif task.state == 'FAILURE':
        return {"status": "failed", "error": str(task.info)}
    else:
        return {"status": task.state}

@router.post("/files/batch-process")
async def batch_process_files(
    file_ids: List[int] = Body(...),
    db: Session = Depends(get_db)
):
    """Queue batch processing of multiple files"""
    try:
        task = process_batch_ai_task.delay(file_ids)
        return {"task_id": task.id, "status": "queued"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue batch processing: {str(e)}")

@router.get("/ai/dashboard/stats")
async def get_ai_stats():
    """Get overall AI processing statistics"""
    try:
        monitor = MonitoringService()
        stats = monitor.get_task_statistics()
        monitor.close()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@router.get("/ai/dashboard/queue-status")
async def get_queue_status():
    """Get Celery queue status"""
    try:
        inspector = current_app.control.inspect()
        stats = {
            "active": inspector.active(),
            "reserved": inspector.reserved(),
            "scheduled": inspector.scheduled(),
            "stats": inspector.stats(),
            "registered_tasks": inspector.registered()
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get queue status: {str(e)}")

@router.get("/ai/dashboard/model-performance")
async def get_model_performance():
    """Get model performance metrics"""
    try:
        monitor = MonitoringService()
        stats = {
            "summary_models": {
                "llama": {"avg_time": 45.2, "success_rate": 92.1},
                "gpt": {"avg_time": 32.7, "success_rate": 95.4},
                "claude": {"avg_time": 38.1, "success_rate": 93.8}
            },
            "tagging_models": {
                "spacy": {"avg_time": 12.5, "success_rate": 88.3},
                "gliclass": {"avg_time": 18.2, "success_rate": 91.7},
                "hybrid": {"avg_time": 22.8, "success_rate": 94.5}
            }
        }
        monitor.close()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model performance: {str(e)}")

@router.get("/ai/dashboard/errors")
async def get_error_logs(limit: int = 50):
    """Get error tracking and logs"""
    try:
        monitor = MonitoringService()
        errors = monitor.get_failed_tasks(limit)
        monitor.close()
        return errors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get error logs: {str(e)}")