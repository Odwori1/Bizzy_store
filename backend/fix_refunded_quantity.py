import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.sale import SaleItem

def fix_refunded_quantity():
    db = SessionLocal()
    try:
        # Update all sale_items where refunded_quantity is NULL to 0
        result = db.query(SaleItem).filter(SaleItem.refunded_quantity == None).update(
            {SaleItem.refunded_quantity: 0}, 
            synchronize_session=False
        )
        db.commit()
        print(f"Updated {result} rows where refunded_quantity was NULL")
        
        # Verify the fix
        null_count = db.query(SaleItem).filter(SaleItem.refunded_quantity == None).count()
        print(f"Rows with NULL refunded_quantity after update: {null_count}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_refunded_quantity()
