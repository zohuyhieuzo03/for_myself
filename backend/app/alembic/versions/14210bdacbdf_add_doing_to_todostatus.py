"""add doing to todostatus

Revision ID: 14210bdacbdf
Revises: 7590979d8b74
Create Date: 2025-09-22 15:07:06.958703

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '14210bdacbdf'
down_revision = '7590979d8b74'
branch_labels = None
depends_on = None


def upgrade():
    # Add new enum value 'doing' to existing PostgreSQL enum type 'todostatus'
    op.execute("ALTER TYPE todostatus ADD VALUE IF NOT EXISTS 'doing'")


def downgrade():
    # Downgrade for removing enum values in PostgreSQL is non-trivial and would
    # require recreating the enum without the value and casting the column.
    # We leave this as a no-op to avoid destructive changes.
    pass
