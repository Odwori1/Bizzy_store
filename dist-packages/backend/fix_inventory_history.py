from app.database import SessionLocal
from app.models.inventory import InventoryHistory
from app.models.sale import Sale
from sqlalchemy import orm

def fix_inventory_history_reasons():
    """Fix inventory history reasons to use business-scoped numbers instead of global IDs"""
    db = SessionLocal()
    try:
        print("Fixing inventory history reasons to use business-scoped numbers...")
        
        # Get all inventory history records that reference sales
        inventory_records = db.query(InventoryHistory).filter(
            InventoryHistory.reason.like('Sale #%')
        ).all()
        
        fixed_count = 0
        for record in inventory_records:
            # Extract the global sale ID from the reason
            try:
                global_id_str = record.reason.split('#')[1]
                global_id = int(global_id_str)
                
                # Find the sale to get its business-scoped number
                sale = db.query(Sale).filter(Sale.id == global_id).first()
                if sale and sale.business_sale_number:
                    # Update the reason with business-scoped number
                    new_reason = f"Sale #{sale.business_sale_number}"
                    if record.reason != new_reason:
                        print(f"  Fixing record {record.id}: '{record.reason}' -> '{new_reason}'")
                        record.reason = new_reason
                        fixed_count += 1
                        
            except (ValueError, IndexError) as e:
                print(f"  Skipping record {record.id}: Could not parse reason '{record.reason}'")
                continue
        
        # Also fix refund-related reasons
        refund_records = db.query(InventoryHistory).filter(
            InventoryHistory.reason.like('Refund #% for Sale #%')
        ).all()
        
        for record in refund_records:
            try:
                # Extract refund and sale IDs from reason like "Refund #1 for Sale #17"
                parts = record.reason.split('#')
                refund_id = int(parts[1].split(' ')[0])  # Get "1" from "Refund #1 for"
                sale_id = int(parts[2])  # Get "17" from "Sale #17"
                
                # Find the sale to get its business-scoped number
                sale = db.query(Sale).filter(Sale.id == sale_id).first()
                if sale and sale.business_sale_number:
                    # Update the reason with business-scoped number
                    new_reason = f"Refund #{refund_id} for Sale #{sale.business_sale_number}"
                    if record.reason != new_reason:
                        print(f"  Fixing refund record {record.id}: '{record.reason}' -> '{new_reason}'")
                        record.reason = new_reason
                        fixed_count += 1
                        
            except (ValueError, IndexError) as e:
                print(f"  Skipping refund record {record.id}: Could not parse reason '{record.reason}'")
                continue
        
        db.commit()
        print(f"✅ Fixed {fixed_count} inventory history records")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Fix failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_inventory_history_reasons()
