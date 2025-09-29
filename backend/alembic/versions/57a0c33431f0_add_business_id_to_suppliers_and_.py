"""add_business_id_to_suppliers_and_purchase_orders

Revision ID: 57a0c33431f0
Revises: bdbaee8512f5
Create Date: 2025-09-29 07:27:27.197569

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '57a0c33431f0'
down_revision = 'bdbaee8512f5'
branch_labels = None
depends_on = None

def upgrade():
    # First, check if there are any businesses and get the first one
    connection = op.get_bind()
    result = connection.execute(text("SELECT id FROM businesses LIMIT 1"))
    first_business = result.fetchone()
    
    if first_business is None:
        # If no businesses exist, create a default one
        connection.execute(text("""
            INSERT INTO businesses (name, currency_code, created_at, updated_at) 
            VALUES ('Default Business', 'USD', NOW(), NOW())
        """))
        result = connection.execute(text("SELECT id FROM businesses LIMIT 1"))
        first_business = result.fetchone()
    
    default_business_id = first_business[0]

    # Add business_id to suppliers table (nullable first)
    op.add_column('suppliers', sa.Column('business_id', sa.Integer(), nullable=True))
    
    # Add business_id to purchase_orders table (nullable first)
    op.add_column('purchase_orders', sa.Column('business_id', sa.Integer(), nullable=True))
    
    # Set default business_id for existing records
    op.execute(text(f"UPDATE suppliers SET business_id = {default_business_id} WHERE business_id IS NULL"))
    op.execute(text(f"UPDATE purchase_orders SET business_id = {default_business_id} WHERE business_id IS NULL"))
    
    # Now create foreign key constraints
    op.create_foreign_key('fk_suppliers_business_id', 'suppliers', 'businesses', ['business_id'], ['id'])
    op.create_foreign_key('fk_purchase_orders_business_id', 'purchase_orders', 'businesses', ['business_id'], ['id'])
    
    # Make columns non-nullable after setting defaults
    op.alter_column('suppliers', 'business_id', nullable=False)
    op.alter_column('purchase_orders', 'business_id', nullable=False)

def downgrade():
    # Remove business_id columns
    op.drop_constraint('fk_purchase_orders_business_id', 'purchase_orders', type_='foreignkey')
    op.drop_column('purchase_orders', 'business_id')
    op.drop_constraint('fk_suppliers_business_id', 'suppliers', type_='foreignkey')
    op.drop_column('suppliers', 'business_id')
