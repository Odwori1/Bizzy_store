#!/usr/bin/env python3
"""
Migration script to backfill historical sales currency data
"""
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')

from app.database import SessionLocal
from sqlalchemy import text

def backfill_sales_currency():
    """Backfill missing original_amount, original_currency, and exchange_rate for historical sales"""
    db = SessionLocal()
    try:
        print("Starting sales currency data backfill...")
        
        # For sales missing original_amount, assume they were in USD
        # Set original_amount = total_amount, original_currency = 'USD', exchange_rate_at_sale = 1.0
        result = db.execute(text("""
            UPDATE sales 
            SET original_amount = total_amount,
                original_currency = 'USD',
                exchange_rate_at_sale = 1.0
            WHERE original_amount IS NULL OR original_amount = 0
        """))
        print(f"Updated {result.rowcount} sales with USD currency data")
        
        db.commit()
        print("✅ Successfully backfilled historical sales currency data")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Backfill failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    backfill_sales_currency()
