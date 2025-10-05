from app.database import SessionLocal
from app.models.inventory import InventoryHistory
from app.models.sale import Sale

def fix_inventory_reasons():
    """Fix inventory history reasons to use business-scoped numbers"""
    db = SessionLocal()
    try:
        print("Fixing inventory history reasons to use business-scoped numbers...")
        
        fixed_count = 0
        
        # Fix sale-related reasons
        sale_records = db.query(InventoryHistory).filter(
            InventoryHistory.reason.like('Sale #%')
        ).all()
        
        for record in sale_records:
            try:
                # Extract global sale ID from reason
                global_id_str = record.reason.split('#')[1]
                global_id = int(global_id_str)
                
                # Find the sale to get its business-scoped number
                sale = db.query(Sale).filter(Sale.id == global_id).first()
                if sale and sale.business_sale_number:
                    # Update reason with business-scoped number
                    new_reason = f"Sale #{sale.business_sale_number}"
                    if record.reason != new_reason:
                        print(f"  Fixing record {record.id}: '{record.reason}' -> '{new_reason}'")
                        record.reason = new_reason
                        fixed_count += 1
            except (ValueError, IndexError):
                continue
        
        # Fix refund-related reasons
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
                    # Update reason with business-scoped number
                    new_reason = f"Refund #{refund_id} for Sale #{sale.business_sale_number}"
                    if record.reason != new_reason:
                        print(f"  Fixing refund record {record.id}: '{record.reason}' -> '{new_reason}'")
                        record.reason = new_reason
                        fixed_count += 1
            except (ValueError, IndexError):
                continue
        
        db.commit()
        print(f"✅ Fixed {fixed_count} inventory history reasons")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Fix failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_inventory_reasons()
