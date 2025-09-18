"""fix_sale_items_calculation_error

Revision ID: 10141a9b4a7f
Revises: 493738ff3cf8
Create Date: 2025-09-14 12:26:23.973686

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = '10141a9b4a7f'
down_revision = '493738ff3cf8'
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    session = Session(bind=bind)

    print("Fixing sale items calculation error...")

    # Get all sale items and fix the USD calculation
    sale_items = session.execute(text("""
        SELECT si.id, p.original_price, p.exchange_rate_at_creation, si.quantity
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
    """)).fetchall()

    for item in sale_items:
        item_id, orig_price, exchange_rate, quantity = item

        # CORRECT CALCULATION: USD = Local * Exchange Rate
        correct_usd_unit_price = orig_price * exchange_rate
        correct_usd_subtotal = correct_usd_unit_price * quantity

        print(f"Correcting sale item {item_id}:")
        print(f"  Local Price: {orig_price}")
        print(f"  Exchange Rate: {exchange_rate}")
        print(f"  Correct USD: {correct_usd_unit_price}")

        session.execute(
            text("""
                UPDATE sale_items
                SET unit_price = :unit_price,
                    subtotal = :subtotal
                WHERE id = :id
            """),
            {
                'unit_price': correct_usd_unit_price,
                'subtotal': correct_usd_subtotal,
                'id': item_id
            }
        )

    session.commit()
    print("Sale items calculation fix completed.")

def downgrade():
    print("WARNING: Cannot safely downgrade calculation fix")
