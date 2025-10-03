# ~/Bizzy_store/backend/fix_gap_now.py
from app.database import SessionLocal
from app.models.sale import Sale
from app.services.sequence_service import SequenceService

def fix_business_6_gap():
    """Fix the sequence gap in Business 6 (sales 8-13 missing)"""
    print("🔧 FIXING BUSINESS 6 SEQUENCE GAP")
    
    db = SessionLocal()
    
    try:
        # Find sale #14 in Business 6
        sale_14 = db.query(Sale).filter(
            Sale.business_id == 6,
            Sale.business_sale_number == 14
        ).first()
        
        if sale_14:
            print(f"Found Sale #14 (ID: {sale_14.id}) - renumbering to #8")
            sale_14.business_sale_number = 8
            db.commit()
            print("✅ Renumbered Sale #14 → Sale #8")
            
            # Sync sequence service
            SequenceService.sync_sequence_with_data(db, 6, 'sale', Sale)
            print("✅ Sequence synced with actual data")
        else:
            print("❌ Sale #14 not found")
            
        # Verify fix
        sales = db.query(Sale.business_sale_number).filter(
            Sale.business_id == 6
        ).order_by(Sale.business_sale_number).all()
        
        sales_numbers = [s[0] for s in sales]
        print(f"📊 Business 6 sales after fix: {sales_numbers}")
        
    except Exception as e:
        print(f"❌ Fix failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_business_6_gap()
