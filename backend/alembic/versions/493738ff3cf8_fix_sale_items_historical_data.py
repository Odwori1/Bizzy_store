"""fix_sale_items_historical_data

Revision ID: 493738ff3cf8
Revises: fcd769111042
Create Date: 2025-01-14 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session
from sqlalchemy.sql import text  # ADD THIS IMPORT

# revision identifiers
revision = '493738ff3cf8'
down_revision = 'fcd769111042'
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    session = Session(bind=bind)

    print("Starting data migration: Fixing sale_items historical data...")

    # Fix sale_items data - use text() for raw SQL
    sale_items_to_fix = session.execute(text("""
        SELECT si.id, si.unit_price, si.quantity, si.original_unit_price, si.original_subtotal,
               p.original_price, p.original_currency_code, p.exchange_rate_at_creation
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.original_unit_price IS NULL OR si.original_subtotal IS NULL
    """)).fetchall()

    print(f"Found {len(sale_items_to_fix)} sale items to fix")

    for item in sale_items_to_fix:
        item_id, unit_price, quantity, orig_unit, orig_subtotal, prod_orig_price, prod_currency, prod_exchange_rate = item
        
        # Set original unit price to product's original price
        new_original_unit_price = prod_orig_price
        new_original_subtotal = prod_orig_price * quantity
        
        # Recalculate USD prices correctly: USD = Local / Exchange Rate
        correct_usd_unit_price = prod_orig_price * prod_exchange_rate
        correct_usd_subtotal = correct_usd_unit_price * quantity

        print(f"Fixing sale item {item_id}:")
        print(f"  Product: {prod_orig_price} {prod_currency}")
        print(f"  Exchange Rate: {prod_exchange_rate}")
        print(f"  Old USD: unit={unit_price}, subtotal={unit_price * quantity}")
        print(f"  New USD: unit={correct_usd_unit_price}, subtotal={correct_usd_subtotal}")
        print(f"  Original: unit={new_original_unit_price}, subtotal={new_original_subtotal}")

        # Update the sale item - use text() for raw SQL
        session.execute(
            text("""
                UPDATE sale_items 
                SET unit_price = :unit_price,
                    subtotal = :subtotal,
                    original_unit_price = :orig_unit_price,
                    original_subtotal = :orig_subtotal
                WHERE id = :id
            """),
            {
                'unit_price': correct_usd_unit_price,
                'subtotal': correct_usd_subtotal,
                'orig_unit_price': new_original_unit_price,
                'orig_subtotal': new_original_subtotal,
                'id': item_id
            }
        )

    session.commit()
    print("Sale items data migration completed.")

def downgrade():
    # Data migration - no safe downgrade
    print("WARNING: Cannot safely downgrade sale items data migration")
