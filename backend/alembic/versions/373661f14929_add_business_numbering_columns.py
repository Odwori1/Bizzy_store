"""add_business_numbering_columns

Revision ID: 373661f14929
Revises: b4c0338c6045
Create Date: 2025-10-01 08:07:33.186177

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '373661f14929'
down_revision = 'b4c0338c6045'
branch_labels = None
depends_on = None


def upgrade():
    # Add business_sale_number to sales table
    op.add_column('sales', sa.Column('business_sale_number', sa.Integer(), nullable=True))
    
    # Add business_product_number to products table  
    op.add_column('products', sa.Column('business_product_number', sa.Integer(), nullable=True))
    
    # Add business_expense_number to expenses table
    op.add_column('expenses', sa.Column('business_expense_number', sa.Integer(), nullable=True))
    
    # Create indexes for better performance
    op.create_index('ix_sales_business_sale_number', 'sales', ['business_id', 'business_sale_number'])
    op.create_index('ix_products_business_product_number', 'products', ['business_id', 'business_product_number'])
    op.create_index('ix_expenses_business_expense_number', 'expenses', ['business_id', 'business_expense_number'])


def downgrade():
    # Drop indexes first
    op.drop_index('ix_expenses_business_expense_number', table_name='expenses')
    op.drop_index('ix_products_business_product_number', table_name='products') 
    op.drop_index('ix_sales_business_sale_number', table_name='sales')
    
    # Then drop columns
    op.drop_column('expenses', 'business_expense_number')
    op.drop_column('products', 'business_product_number')
    op.drop_column('sales', 'business_sale_number')
