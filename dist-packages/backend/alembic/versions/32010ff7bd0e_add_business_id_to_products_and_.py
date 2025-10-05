"""add_business_id_to_products_and_customers

Revision ID: 32010ff7bd0e
Revises: 32e199b69446
Create Date: 2025-09-21 08:46:00.753016

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '32010ff7bd0e'
down_revision = '32e199b69446'
branch_labels = None
depends_on = None

def upgrade():
    # Add business_id to products
    op.add_column('products', sa.Column('business_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_products_business_id', 'products', 'businesses', ['business_id'], ['id'])

    # Add business_id to customers
    op.add_column('customers', sa.Column('business_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_customers_business_id', 'customers', 'businesses', ['business_id'], ['id'])

    # Set default business_id for existing data (assign to business 2)
    op.execute("UPDATE products SET business_id = 2 WHERE business_id IS NULL")
    op.execute("UPDATE customers SET business_id = 2 WHERE business_id IS NULL")

    # Make columns not nullable
    op.alter_column('products', 'business_id', nullable=False)
    op.alter_column('customers', 'business_id', nullable=False)

def downgrade():
    op.drop_constraint('fk_products_business_id', 'products', type_='foreignkey')
    op.drop_column('products', 'business_id')
    op.drop_constraint('fk_customers_business_id', 'customers', type_='foreignkey')
    op.drop_column('customers', 'business_id')
