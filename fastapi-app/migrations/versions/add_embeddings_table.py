"""Add embeddings table

Revision ID: 1a2b3c4d5e6f
Revises: 0d76f7ec2b26
Create Date: 2025-08-06 18:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = '0d76f7ec2b26'
branch_labels = None
depends_on = None


def upgrade():
    # Create file_embeddings table
    op.create_table('file_embeddings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('file_id', sa.Integer(), nullable=False),
        sa.Column('embedding', postgresql.BYTEA(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['file_id'], ['files.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('file_id')
    )
    op.create_index(op.f('ix_file_embeddings_file_id'), 'file_embeddings', ['file_id'], unique=True)


def downgrade():
    op.drop_index(op.f('ix_file_embeddings_file_id'), table_name='file_embeddings')
    op.drop_table('file_embeddings')