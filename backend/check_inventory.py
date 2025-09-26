# create check_inventory.py
from app.database import SessionLocal
from app.models.inventory import InventoryHistory

def check_inventory_history():
    db = SessionLocal()
    try:
        # Get inventory history for product_id 19
        history = db.query(InventoryHistory).filter(
            InventoryHistory.product_id == 19
        ).order_by(InventoryHistory.changed_at).all()
        
        for entry in history:
            print(f"ID: {entry.id}, Type: {entry.change_type}, Change: {entry.quantity_change}, "
                  f"Prev: {entry.previous_quantity}, New: {entry.new_quantity}, "
                  f"Reason: {entry.reason}, Changed by: {entry.changed_by}, "
                  f"Time: {entry.changed_at}")
    finally:
        db.close()

if __name__ == "__main__":
    check_inventory_history()
