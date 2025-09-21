"""add_income_to_categorygroup_enum

Revision ID: be5dd2e58c66
Revises: 7f15f0079160
Create Date: 2025-09-21 23:08:58.457925

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'be5dd2e58c66'
down_revision = '7f15f0079160'
branch_labels = None
depends_on = None


def upgrade():
    # Add 'income' to the categorygroup enum
    op.execute("ALTER TYPE categorygroup ADD VALUE 'income'")


def downgrade():
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type and updating all references
    # For now, we'll leave the enum value in place
    pass
