"""Add full-text search indexes

Revision ID: 2f8a7b9c4d5e
Revises: 414f0d373844
Create Date: 2025-08-06 06:48:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "2f8a7b9c4d5e"
down_revision = "414f0d373844"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create full-text search indexes
    op.create_index(
        "idx_search_vector", "search_index", [sa.text("search_vector")], postgresql_using="gin"
    )

    # Create index on extraction status
    op.create_index("idx_extracted_content_status", "extracted_content", ["extraction_status"])

    # Create index on file_id for search_index
    op.create_index("idx_search_index_file_id", "search_index", ["file_id"], unique=True)

    # Create index on task status
    op.create_index("idx_extraction_task_status", "extraction_tasks", ["status"])

    # Create index on file_id for extraction_tasks
    op.create_index("idx_extraction_task_file_id", "extraction_tasks", ["file_id"])

    # Create index on task_id
    op.create_index("idx_extraction_task_task_id", "extraction_tasks", ["task_id"], unique=True)


def downgrade() -> None:
    # Drop indexes
    op.drop_index("idx_search_vector", table_name="search_index")
    op.drop_index("idx_extracted_content_status", table_name="extracted_content")
    op.drop_index("idx_search_index_file_id", table_name="search_index")
    op.drop_index("idx_extraction_task_status", table_name="extraction_tasks")
    op.drop_index("idx_extraction_task_file_id", table_name="extraction_tasks")
    op.drop_index("idx_extraction_task_task_id", table_name="extraction_tasks")
