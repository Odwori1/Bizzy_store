from app.database import SessionLocal
from app.models.inventory import InventoryHistory
from app.models.sale import Sale
from app.models.product import Product

def fix_all_inventory_business_ids():
    """Fix all null business_id in inventory history records"""
    db = SessionLocal()
    try:
        print("Fixing ALL null business_id in inventory history...")
        
        total_fixed = 0
        
        # Method 1: Fix via sale references in reason field
        sale_ref_records = db.query(InventoryHistory).filter(
            InventoryHistory.reason.like('Sale #%'),
            InventoryHistory.business_id.is_(None)
        ).all()
        
        for record in sale_ref_records:
            try:
                sale_id_str = record.reason.split('#')[1]
                sale_id = int(sale_id_str)
                sale = db.query(Sale).filter(Sale.id == sale_id).first()
                if sale and sale.business_id:
                    record.business_id = sale.business_id
                    total_fixed += 1
                    print(f"  Fixed sale record {record.id}: business_id = {sale.business_id}")
            except (ValueError, IndexError):
                continue
        
        # Method 2: Fix via product business_id
        product_records = db.query(InventoryHistory).filter(
            InventoryHistory.business_id.is_(None)
        ).all()
        
        for record in product_records:
            product = db.query(Product).filter(Product.id == record.product_id).first()
            if product and product.business_id:
                record.business_id = product.business_id
                total_fixed += 1
                print(f"  Fixed product record {record.id}: business_id = {product.business_id}")
        
        db.commit()
        print(f"✅ Fixed {total_fixed} inventory records with business_id")
        
        # Verify fix
        remaining_null = db.query(InventoryHistory).filter(
            InventoryHistory.business_id.is_(None)
        ).count()
        print(f"📊 Remaining null business_id records: {remaining_null}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Fix failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_all_inventory_business_ids()
