from celery import shared_task
from celery.utils.log import get_task_logger
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from models.file import File, AITag, AISummary, Tag
from config import SessionLocal
import httpx
import time

logger = get_task_logger(__name__)

@shared_task(bind=True, max_retries=3, queue='ai_processing')
def generate_summary_task(self, file_id: int, length: str = "medium", model: str = "llama"):
    """Async task for document summarization"""
    db = SessionLocal()
    try:
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise ValueError(f"File {file_id} not found")

        # Track progress
        self.update_state(state='PROGRESS', meta={'progress': 10})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://ai-summarization:8002/summarize",
                json={"text": file.extracted_content.text, 
                     "max_length": 150 if length == "short" else 250 if length == "medium" else 500}
            )
            response.raise_for_status()
            summary_data = response.json()

            self.update_state(state='PROGRESS', meta={'progress': 75})
            
            # Store summary
            db_summary = AISummary(
                file_id=file_id,
                summary=summary_data["summary"],
                model=model,
                length=length,
                created_at=datetime.utcnow()
            )
            db.add(db_summary)
            db.commit()

            return {"summary": summary_data["summary"], "file_id": file_id}
            
    except Exception as e:
        logger.error(f"Summary generation failed for file {file_id}: {str(e)}")
        self.retry(exc=e, countdown=60)
    finally:
        db.close()

@shared_task(bind=True, max_retries=3, queue='ai_processing')
def auto_tag_task(self, file_id: int, strategy: str = "hybrid"):
    """Async task for automatic tag generation"""
    db = SessionLocal()
    try:
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise ValueError(f"File {file_id} not found")

        self.update_state(state='PROGRESS', meta={'progress': 10})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://auto-tagging:8001/generate-tags",
                json={
                    "text": file.extracted_content.text,
                    "candidate_labels": [t.name for t in db.query(Tag).all()]
                }
            )
            response.raise_for_status()
            tags_data = response.json()

            self.update_state(state='PROGRESS', meta={'progress': 75})
            
            # Store tags
            for label, score in tags_data["classification"].items():
                if score > 0.5:
                    db_tag = AITag(
                        file_id=file_id,
                        tag=label,
                        confidence=score,
                        source=strategy,
                        created_at=datetime.utcnow()
                    )
                    db.add(db_tag)
            db.commit()

            return {"tags": tags_data["classification"], "file_id": file_id}
            
    except Exception as e:
        logger.error(f"Tag generation failed for file {file_id}: {str(e)}")
        self.retry(exc=e, countdown=60)
    finally:
        db.close()

@shared_task(bind=True, max_retries=3, queue='ai_batch')
def process_batch_ai_task(self, file_ids: list[int]):
    """Batch processing task for multiple files"""
    results = []
    total_files = len(file_ids)
    
    for i, file_id in enumerate(file_ids):
        try:
            # Update progress
            progress = int((i / total_files) * 100)
            self.update_state(state='PROGRESS', 
                           meta={'progress': progress,
                                'current': i+1,
                                'total': total_files})
            
            # Process each file
            summary_result = generate_summary_task.delay(file_id)
            tag_result = auto_tag_task.delay(file_id)
            
            results.append({
                "file_id": file_id,
                "summary_task_id": summary_result.id,
                "tag_task_id": tag_result.id
            })
            
        except Exception as e:
            logger.error(f"Batch processing failed for file {file_id}: {str(e)}")
            results.append({
                "file_id": file_id,
                "error": str(e)
            })
    
    return {
        "processed_files": len(file_ids),
        "successful": len([r for r in results if "error" not in r]),
        "results": results
    }