"""PostgreSQL initial migration with full-text search support

Revision ID: 3f8a9c5d6e7f
Revises: 
Create Date: 2025-08-06 09:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "3f8a9c5d6e7f"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create files table
    op.create_table(
        "files",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("path", sa.String(length=500), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=100), nullable=False),
        sa.Column("upload_date", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for files table
    op.create_index("ix_files_id", "files", ["id"], unique=False)
    op.create_index("ix_files_name", "files", ["name"], unique=False)
    op.create_index("idx_file_type", "files", ["type"])
    op.create_index("idx_file_upload_date", "files", ["upload_date"])

    # Create extracted_content table
    op.create_table(
        "extracted_content",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("file_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text()),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("extraction_status", sa.String(length=20), nullable=False),
        sa.Column("error_message", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["file_id"], ["files.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("file_id"),
    )

    # Create indexes for extracted_content table
    op.create_index("idx_extracted_content_status", "extracted_content", ["extraction_status"])
    op.create_index("idx_extracted_content_created_at", "extracted_content", ["created_at"])
    op.create_index("idx_extracted_content_file_id", "extracted_content", ["file_id"], unique=True)

    # Create search_index table
    op.create_table(
        "search_index",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("file_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text()),
        sa.Column("search_vector", postgresql.TSVECTOR()),
        sa.Column("indexed_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["file_id"], ["files.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("file_id"),
    )

    # Create indexes for search_index table
    op.create_index("idx_search_vector", "search_index", ["search_vector"], postgresql_using="gin")
    op.create_index("idx_search_index_file_id", "search_index", ["file_id"], unique=True)

    # Create extraction_tasks table
    op.create_table(
        "extraction_tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("file_id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("retry_count", sa.Integer(), nullable=False),
        sa.Column("max_retries", sa.Integer(), nullable=False),
        sa.Column("error_message", sa.Text()),
        sa.Column("started_at", sa.DateTime()),
        sa.Column("completed_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["file_id"], ["files.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_id"),
    )

    # Create indexes for extraction_tasks table
    op.create_index("idx_extraction_task_status", "extraction_tasks", ["status"])
    op.create_index("idx_extraction_task_task_id", "extraction_tasks", ["task_id"], unique=True)
    op.create_index("idx_extraction_task_file_id", "extraction_tasks", ["file_id"])


def downgrade() -> None:
    # Drop indexes for extraction_tasks table
    op.drop_index("idx_extraction_task_file_id", table_name="extraction_tasks")
    op.drop_index("idx_extraction_task_task_id", table_name="extraction_tasks")
    op.drop_index("idx_extraction_task_status", table_name="extraction_tasks")

    # Drop extraction_tasks table
    op.drop_table("extraction_tasks")

    # Drop indexes for search_index table
    op.drop_index("idx_search_index_file_id", table_name="search_index")
    op.drop_index("idx_search_vector", table_name="search_index")

    # Drop search_index table
    op.drop_table("search_index")

    # Drop indexes for extracted_content table
    op.drop_index("idx_extracted_content_file_id", table_name="extracted_content")
    op.drop_index("idx_extracted_content_created_at", table_name="extracted_content")
    op.drop_index("idx_extracted_content_status", table_name="extracted_content")

    # Drop extracted_content table
    op.drop_table("extracted_content")

    # Drop indexes for files table
    op.drop_index("idx_file_upload_date", table_name="files")
    op.drop_index("idx_file_type", table_name="files")
    op.drop_index("ix_files_name", table_name="files")
    op.drop_index("ix_files_id", table_name="files")

    # Drop files table
    op.drop_table("files")
