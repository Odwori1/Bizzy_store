"""add_exchange_rate_field_to_expenses

Revision ID: f5328394d87e
Revises: b2214e934633
Create Date: 2025-09-06 14:20:20.962294

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f5328394d87e'
down_revision = 'b2214e934633'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('expenses', sa.Column('exchange_rate', sa.Numeric(precision=10, scale=6), nullable=True))

def downgrade():
    op.drop_column('expenses', 'exchange_rate')
