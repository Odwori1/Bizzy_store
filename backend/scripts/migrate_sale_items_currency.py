#!/usr/bin/env python3
"""
Migration script to backfill original_amount data for sale_items
"""
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')

from app.database import SessionLocal
from sqlalchemy import text

def migrate_sale_items_currency():
    """Backfill original_unit_price and original_subtotal for sale_items"""
    db = SessionLocal()
    try:
        print("Starting sale_items currency data migration...")
        
        # Update sale_items with original_unit_price from products
        result = db.execute(text("""
            UPDATE sale_items si
            SET original_unit_price = p.original_price
            FROM products p
            WHERE si.product_id = p.id 
            AND si.original_unit_price IS NULL
        """))
        print(f"Updated {result.rowcount} rows with original_unit_price")
        
        # Update sale_items with original_subtotal (quantity * original_unit_price)
        result = db.execute(text("""
            UPDATE sale_items 
            SET original_subtotal = quantity * original_unit_price
            WHERE original_subtotal IS NULL
            AND original_unit_price IS NOT NULL
        """))
        print(f"Updated {result.rowcount} rows with original_subtotal")
        
        db.commit()
        print("✅ Successfully migrated sale_items currency data")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_sale_items_currency()
