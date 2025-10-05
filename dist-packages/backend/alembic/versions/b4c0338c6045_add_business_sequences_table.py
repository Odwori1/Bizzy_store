"""add_business_sequences_table

Revision ID: b4c0338c6045
Revises: 57a0c33431f0
Create Date: 2025-10-01 07:59:52.758255

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b4c0338c6045'
down_revision = '57a0c33431f0'
branch_labels = None
depends_on = None


def upgrade():
    # Create business_sequences table
    op.create_table('business_sequences',
        sa.Column('business_id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('last_number', sa.Integer(), nullable=True, server_default='0'),
        sa.PrimaryKeyConstraint('business_id', 'entity_type'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], )
    )
    
    # Create index for better performance
    op.create_index('ix_business_sequences_business_entity', 'business_sequences', ['business_id', 'entity_type'])


def downgrade():
    # Drop index and table
    op.drop_index('ix_business_sequences_business_entity', table_name='business_sequences')
    op.drop_table('business_sequences')
