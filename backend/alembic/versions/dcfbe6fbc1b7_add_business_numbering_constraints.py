"""add_business_numbering_constraints

Revision ID: dcfbe6fbc1b7
Revises: b405030c954c
Create Date: 2025-10-02 07:22:49.345920

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'dcfbe6fbc1b7'
down_revision = 'b405030c954c'
branch_labels = None
depends_on = None

def upgrade():
    # Add unique constraints to prevent duplicate numbers within same business
    op.create_unique_constraint(
        'uq_business_sale_number',
        'sales',
        ['business_id', 'business_sale_number']
    )
    op.create_unique_constraint(
        'uq_business_refund_number', 
        'refunds',
        ['business_id', 'business_refund_number']
    )
    op.create_unique_constraint(
        'uq_business_product_number',
        'products', 
        ['business_id', 'business_product_number']
    )
    op.create_unique_constraint(
        'uq_business_expense_number',
        'expenses',
        ['business_id', 'business_expense_number']
    )

    # Make business numbering columns NOT NULL
    op.alter_column('sales', 'business_sale_number',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('refunds', 'business_refund_number',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('products', 'business_product_number',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('expenses', 'business_expense_number',
               existing_type=sa.INTEGER(),
               nullable=False)

def downgrade():
    # Remove unique constraints
    op.drop_constraint('uq_business_sale_number', 'sales', type_='unique')
    op.drop_constraint('uq_business_refund_number', 'refunds', type_='unique')
    op.drop_constraint('uq_business_product_number', 'products', type_='unique')
    op.drop_constraint('uq_business_expense_number', 'expenses', type_='unique')

    # Make columns nullable again
    op.alter_column('sales', 'business_sale_number',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('refunds', 'business_refund_number',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('products', 'business_product_number',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('expenses', 'business_expense_number',
               existing_type=sa.INTEGER(),
               nullable=True)
