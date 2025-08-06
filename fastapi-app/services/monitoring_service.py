import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from models.content_extraction import ExtractionTask
from config import SessionLocal

logger = logging.getLogger(__name__)


class MonitoringService:
    """Service for monitoring background tasks and system health"""

    def __init__(self):
        self.db = SessionLocal()

    def get_task_statistics(self) -> Dict[str, Any]:
        """Get comprehensive task statistics"""
        try:
            # Overall statistics
            total_tasks = self.db.query(ExtractionTask).count()

            status_counts = self.db.execute(
                text(
                    """
                SELECT status, COUNT(*) as count
                FROM extraction_tasks
                GROUP BY status
            """
                )
            ).fetchall()

            status_stats = {row.status: row.count for row in status_counts}

            # Recent tasks (last 24 hours)
            recent_cutoff = datetime.utcnow() - timedelta(hours=24)
            recent_tasks = (
                self.db.query(ExtractionTask)
                .filter(ExtractionTask.created_at >= recent_cutoff)
                .count()
            )

            # Failed tasks
            failed_tasks = (
                self.db.query(ExtractionTask).filter(ExtractionTask.status == "failed").count()
            )

            # Average processing time
            avg_processing_time = self.db.execute(
                text(
                    """
                SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_seconds
                FROM extraction_tasks
                WHERE status = 'completed'
                AND started_at IS NOT NULL
                AND completed_at IS NOT NULL
            """
                )
            ).scalar()

            # Success rate
            success_rate = 0
            if total_tasks > 0:
                completed = status_stats.get("completed", 0)
                success_rate = (completed / total_tasks) * 100

            return {
                "total_tasks": total_tasks,
                "recent_tasks": recent_tasks,
                "failed_tasks": failed_tasks,
                "status_breakdown": status_stats,
                "success_rate": round(success_rate, 2),
                "average_processing_time": round(avg_processing_time or 0, 2),
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error getting task statistics: {str(e)}")
            return {"error": str(e)}

    def get_failed_tasks(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get list of failed tasks with details"""
        try:
            failed_tasks = self.db.execute(
                text(
                    """
                SELECT 
                    t.id,
                    t.task_id,
                    t.file_id,
                    f.name as file_name,
                    t.error_message,
                    t.retry_count,
                    t.max_retries,
                    t.created_at,
                    t.started_at,
                    t.completed_at
                FROM extraction_tasks t
                JOIN files f ON t.file_id = f.id
                WHERE t.status = 'failed'
                ORDER BY t.created_at DESC
                LIMIT :limit
            """
                ),
                {"limit": limit},
            ).fetchall()

            return [
                {
                    "id": row.id,
                    "task_id": row.task_id,
                    "file_id": row.file_id,
                    "file_name": row.file_name,
                    "error_message": row.error_message,
                    "retry_count": row.retry_count,
                    "max_retries": row.max_retries,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "started_at": row.started_at.isoformat() if row.started_at else None,
                    "completed_at": row.completed_at.isoformat() if row.completed_at else None,
                }
                for row in failed_tasks
            ]

        except Exception as e:
            logger.error(f"Error getting failed tasks: {str(e)}")
            return []

    def get_pending_tasks(self) -> List[Dict[str, Any]]:
        """Get list of pending tasks"""
        try:
            pending_tasks = self.db.execute(
                text(
                    """
                SELECT 
                    t.id,
                    t.task_id,
                    t.file_id,
                    f.name as file_name,
                    f.size as file_size,
                    t.created_at,
                    t.retry_count
                FROM extraction_tasks t
                JOIN files f ON t.file_id = f.id
                WHERE t.status = 'pending'
                ORDER BY t.created_at ASC
            """
                )
            ).fetchall()

            return [
                {
                    "id": row.id,
                    "task_id": row.task_id,
                    "file_id": row.file_id,
                    "file_name": row.file_name,
                    "file_size": row.file_size,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "retry_count": row.retry_count,
                }
                for row in pending_tasks
            ]

        except Exception as e:
            logger.error(f"Error getting pending tasks: {str(e)}")
            return []

    def get_processing_tasks(self) -> List[Dict[str, Any]]:
        """Get list of currently processing tasks"""
        try:
            processing_tasks = self.db.execute(
                text(
                    """
                SELECT 
                    t.id,
                    t.task_id,
                    t.file_id,
                    f.name as file_name,
                    t.started_at,
                    t.retry_count
                FROM extraction_tasks t
                JOIN files f ON t.file_id = f.id
                WHERE t.status = 'processing'
                ORDER BY t.started_at ASC
            """
                )
            ).fetchall()

            return [
                {
                    "id": row.id,
                    "task_id": row.task_id,
                    "file_id": row.file_id,
                    "file_name": row.file_name,
                    "started_at": row.started_at.isoformat() if row.started_at else None,
                    "retry_count": row.retry_count,
                }
                for row in processing_tasks
            ]

        except Exception as e:
            logger.error(f"Error getting processing tasks: {str(e)}")
            return []

    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health status"""
        try:
            stats = self.get_task_statistics()

            # Determine health status
            health_status = "healthy"
            issues = []

            if stats.get("failed_tasks", 0) > 10:
                health_status = "warning"
                issues.append("High number of failed tasks")

            if stats.get("success_rate", 100) < 80:
                health_status = "warning"
                issues.append("Low success rate")

            if stats.get("average_processing_time", 0) > 300:  # 5 minutes
                health_status = "warning"
                issues.append("High processing time")

            return {
                "status": health_status,
                "issues": issues,
                "statistics": stats,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error getting system health: {str(e)}")
            return {
                "status": "error",
                "issues": [str(e)],
                "timestamp": datetime.utcnow().isoformat(),
            }

    def cleanup_old_tasks(self, days: int = 7) -> Dict[str, int]:
        """Clean up old completed/failed tasks"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)

            # Clean up old completed tasks
            completed_deleted = self.db.execute(
                text(
                    """
                DELETE FROM extraction_tasks
                WHERE status = 'completed'
                AND created_at < :cutoff_date
            """
                ),
                {"cutoff_date": cutoff_date},
            ).rowcount

            # Clean up old failed tasks
            failed_deleted = self.db.execute(
                text(
                    """
                DELETE FROM extraction_tasks
                WHERE status = 'failed'
                AND created_at < :cutoff_date
            """
                ),
                {"cutoff_date": cutoff_date},
            ).rowcount

            self.db.commit()

            return {
                "completed_tasks_deleted": completed_deleted,
                "failed_tasks_deleted": failed_deleted,
                "total_deleted": completed_deleted + failed_deleted,
            }

        except Exception as e:
            logger.error(f"Error cleaning up old tasks: {str(e)}")
            self.db.rollback()
            return {"error": str(e)}

    def close(self):
        """Close database connection"""
        if self.db:
            self.db.close()
