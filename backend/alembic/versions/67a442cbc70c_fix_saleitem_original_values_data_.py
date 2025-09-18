"""fix_saleitem_original_values_data_migration

Revision ID: 67a442cbc70c
Revises: b413554f3fb6
Create Date: 2025-09-15 06:30:01.163916

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '67a442cbc70c'
down_revision = 'b413554f3fb6'
branch_labels = None
depends_on = None

def upgrade():
    # Data migration: Fix SaleItem original values where they are 0
    connection = op.get_bind()

    # Use larger precision to handle UGX amounts (up to 999,999,999.99)
    update_query = """
    UPDATE sale_items
    SET
        original_unit_price = (sale_items.unit_price / sales.exchange_rate_at_sale)::numeric(12,2),
        original_subtotal = (sale_items.subtotal / sales.exchange_rate_at_sale)::numeric(12,2)
    FROM sales
    WHERE
        sale_items.sale_id = sales.id
        AND (sale_items.original_subtotal = 0 OR sale_items.original_subtotal IS NULL)
        AND sale_items.subtotal > 0
        AND sales.exchange_rate_at_sale > 0
    """

    result = connection.execute(sa.text(update_query))
    print(f"Data migration completed: Fixed {result.rowcount} SaleItem records")


def downgrade():
    # Data migrations cannot be rolled back safely
    # This is a one-way data correction
    pass
