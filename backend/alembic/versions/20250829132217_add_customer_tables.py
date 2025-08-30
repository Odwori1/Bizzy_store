"""Add customer tables

Revision ID: 5a5a5a5a5a5a
Revises: 0b88dcf53d04
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '5a5a5a5a5a5a'
down_revision = '0b88dcf53d04'
branch_labels = None
depends_on = None

def upgrade():
    # Create customers table
    op.create_table('customers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('address', sa.String(length=200), nullable=True),
        sa.Column('loyalty_points', sa.Integer(), server_default='0', nullable=True),
        sa.Column('total_spent', sa.Float(), server_default='0.0', nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('last_purchase', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_customers_email'), 'customers', ['email'], unique=True)
    op.create_index(op.f('ix_customers_id'), 'customers', ['id'], unique=False)
    
    # Add customer_id column to sales table
    op.add_column('sales', sa.Column('customer_id', sa.Integer(), nullable=True))
    
    # Create foreign key constraint
    op.create_foreign_key('fk_sales_customer_id', 'sales', 'customers', ['customer_id'], ['id'])

def downgrade():
    # Remove foreign key constraint
    op.drop_constraint('fk_sales_customer_id', 'sales', type_='foreignkey')
    
    # Remove customer_id column from sales table
    op.drop_column('sales', 'customer_id')
    
    # Drop customers table
    op.drop_table('customers')
