from celery import Celery
from config import settings

celery_app = Celery(
    "filemanager",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "fastapi-app.tasks.content_extraction",
        "fastapi-app.tasks.ai_processing"
    ],
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
    task_routes={
        'fastapi-app.tasks.ai_processing.generate_summary_task': {
            'queue': 'ai_processing',
            'priority': 5
        },
        'fastapi-app.tasks.ai_processing.auto_tag_task': {
            'queue': 'ai_processing',
            'priority': 5
        },
        'fastapi-app.tasks.ai_processing.process_batch_ai_task': {
            'queue': 'ai_batch',
            'priority': 3
        },
    },
    task_annotations={
        'fastapi-app.tasks.ai_processing.*': {
            'max_retries': 3,
            'retry_backoff': True,
            'retry_backoff_max': 600,
            'retry_jitter': True
        }
    },
    beat_schedule={
        "cleanup-failed-tasks": {
            "task": "fastapi-app.tasks.content_extraction.cleanup_failed_tasks",
            "schedule": 3600.0,  # Run every hour
        },
    },
)
