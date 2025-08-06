"""merge full-text search migrations

Revision ID: 0d76f7ec2b26
Revises: 2f8a7b9c4d5e, 3f8a9c5d6e7f
Create Date: 2025-08-06 17:28:40.633997

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0d76f7ec2b26'
down_revision = ('2f8a7b9c4d5e', '3f8a9c5d6e7f')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass