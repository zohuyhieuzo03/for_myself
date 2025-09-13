"""Add created and updated to Todo table

Revision ID: 6809999a639f
Revises: 1a31ce608336
Create Date: 2025-09-13 04:35:25.601139

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from datetime import datetime
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '6809999a639f'
down_revision = '1a31ce608336'
branch_labels = None
depends_on = None


def upgrade():
    # First create the todo table if it doesn't exist
    op.create_table(
        'todo',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    
    # Update existing records with current timestamp
    op.execute("UPDATE todo SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL")
    
    # Now make columns NOT NULL
    op.alter_column('todo', 'created_at', nullable=False)
    op.alter_column('todo', 'updated_at', nullable=False)


def downgrade():
    op.drop_table('todo')
