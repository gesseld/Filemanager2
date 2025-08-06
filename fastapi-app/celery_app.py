from celery import Celery
from config import settings

celery_app = Celery(
    "filemanager",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["fastapi-app.tasks.content_extraction"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    result_expires=3600,  # 1 hour
    beat_schedule={
        "cleanup-failed-tasks": {
            "task": "fastapi-app.tasks.content_extraction.cleanup_failed_tasks",
            "schedule": 3600.0,  # Run every hour
        },
    },
)
