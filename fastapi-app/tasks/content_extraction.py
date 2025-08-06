import os
import logging
from datetime import datetime
from typing import Optional, Dict, Any
import requests
from celery import Task
from sqlalchemy.orm import Session

from celery_app import celery_app
from config import SessionLocal, settings
from models.file import File
from models.content_extraction import ExtractedContent, ExtractionTask, SearchIndex

logger = logging.getLogger(__name__)


class ExtractionTaskBase(Task):
    """Base task class with database session management"""

    def __init__(self):
        self.db: Optional[Session] = None

    def __call__(self, *args, **kwargs):
        self.db = SessionLocal()
        try:
            return self.run(*args, **kwargs)
        finally:
            if self.db:
                self.db.close()


@celery_app.task(base=ExtractionTaskBase, bind=True, max_retries=3)
def extract_content(self, file_id: int, task_id: str) -> Dict[str, Any]:
    """Extract content from a file using Apache Tika"""
    try:
        # Update task status
        extraction_task = (
            self.db.query(ExtractionTask).filter(ExtractionTask.task_id == task_id).first()
        )

        if not extraction_task:
            logger.error(f"Task {task_id} not found")
            return {"status": "failed", "error": "Task not found"}

        extraction_task.status = "processing"
        extraction_task.started_at = datetime.utcnow()
        self.db.commit()

        # Get file information
        file_record = self.db.query(File).filter(File.id == file_id).first()
        if not file_record:
            raise ValueError(f"File with id {file_id} not found")

        file_path = file_record.path
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File {file_path} not found")

        # Extract content using Tika
        with open(file_path, "rb") as file:
            response = requests.put(
                settings.TIKA_SERVER_URL,
                data=file,
                headers={"Accept": "text/plain", "Content-Type": "application/octet-stream"},
                timeout=300,  # 5 minutes timeout
            )

        if response.status_code != 200:
            raise Exception(f"Tika extraction failed: {response.status_code} - {response.text}")

        content = response.text.strip()

        # Save extracted content
        extracted_content = (
            self.db.query(ExtractedContent).filter(ExtractedContent.file_id == file_id).first()
        )

        if extracted_content:
            extracted_content.content = content
            extracted_content.extraction_status = "completed"
            extracted_content.error_message = None
            extracted_content.updated_at = datetime.utcnow()
        else:
            extracted_content = ExtractedContent(
                file_id=file_id, content=content, extraction_status="completed"
            )
            self.db.add(extracted_content)

        # Update task status
        extraction_task.status = "completed"
        extraction_task.completed_at = datetime.utcnow()
        self.db.commit()

        # Trigger search indexing
        index_content.delay(file_id)

        return {"status": "completed", "file_id": file_id, "content_length": len(content)}

    except Exception as e:
        logger.error(f"Content extraction failed for file {file_id}: {str(e)}")

        # Update task status
        extraction_task = (
            self.db.query(ExtractionTask).filter(ExtractionTask.task_id == task_id).first()
        )

        if extraction_task:
            extraction_task.status = "failed"
            extraction_task.error_message = str(e)
            extraction_task.retry_count += 1
            self.db.commit()

        # Update extracted content status
        extracted_content = (
            self.db.query(ExtractedContent).filter(ExtractedContent.file_id == file_id).first()
        )

        if extracted_content:
            extracted_content.extraction_status = "failed"
            extracted_content.error_message = str(e)
            self.db.commit()

        # Retry if max retries not reached
        if extraction_task and extraction_task.retry_count < extraction_task.max_retries:
            raise self.retry(exc=e, countdown=60 * extraction_task.retry_count)

        return {"status": "failed", "error": str(e)}


@celery_app.task(base=ExtractionTaskBase, bind=True)
def index_content(self, file_id: int) -> Dict[str, Any]:
    """Index extracted content for full-text search"""
    try:
        # Get extracted content
        extracted_content = (
            self.db.query(ExtractedContent)
            .filter(
                ExtractedContent.file_id == file_id,
                ExtractedContent.extraction_status == "completed",
            )
            .first()
        )

        if not extracted_content or not extracted_content.content:
            return {"status": "skipped", "reason": "No content to index"}

        # Create or update search index
        search_index = self.db.query(SearchIndex).filter(SearchIndex.file_id == file_id).first()

        if search_index:
            search_index.content = extracted_content.content
            search_index.indexed_at = datetime.utcnow()
        else:
            search_index = SearchIndex(file_id=file_id, content=extracted_content.content)
            self.db.add(search_index)

        self.db.commit()

        return {
            "status": "completed",
            "file_id": file_id,
            "content_length": len(extracted_content.content),
        }

    except Exception as e:
        logger.error(f"Content indexing failed for file {file_id}: {str(e)}")
        return {"status": "failed", "error": str(e)}


@celery_app.task(base=ExtractionTaskBase, bind=True)
def cleanup_failed_tasks(self) -> Dict[str, Any]:
    """Clean up old failed extraction tasks"""
    try:
        from datetime import timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=7)  # 7 days ago

        # Delete old failed tasks
        deleted_count = (
            self.db.query(ExtractionTask)
            .filter(ExtractionTask.status == "failed", ExtractionTask.created_at < cutoff_date)
            .delete()
        )

        self.db.commit()

        return {"status": "completed", "deleted_tasks": deleted_count}

    except Exception as e:
        logger.error(f"Cleanup failed tasks error: {str(e)}")
        return {"status": "failed", "error": str(e)}


@celery_app.task(base=ExtractionTaskBase, bind=True)
def reindex_all_content(self) -> Dict[str, Any]:
    """Reindex all extracted content"""
    try:
        extracted_contents = (
            self.db.query(ExtractedContent)
            .filter(ExtractedContent.extraction_status == "completed")
            .all()
        )

        indexed_count = 0
        for content in extracted_contents:
            index_content.delay(content.file_id)
            indexed_count += 1

        return {"status": "started", "total_files": indexed_count}

    except Exception as e:
        logger.error(f"Reindex all content error: {str(e)}")
        return {"status": "failed", "error": str(e)}
