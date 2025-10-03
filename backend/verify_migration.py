from app.database import SessionLocal
from app.services.sequence_service import SequenceService

def verify_migration():
    db = SessionLocal()
    try:
        print("🔍 Verifying Migration...")
        
        # Test sequence generation
        numbers = []
        numbers.append(SequenceService.get_next_number(db, 6, 'sale'))
        numbers.append(SequenceService.get_next_number(db, 6, 'sale')) 
        numbers.append(SequenceService.get_next_number(db, 7, 'sale'))
        numbers.append(SequenceService.get_next_number(db, 6, 'product'))
        
        expected = [1, 2, 1, 1]
        if numbers == expected:
            print(f"✅ Sequence generation correct: {numbers}")
        else:
            print(f"❌ Sequence generation failed. Expected {expected}, got {numbers}")
            return False
            
        # Verify current numbers
        current_sale_6 = SequenceService.get_current_number(db, 6, 'sale')
        current_sale_7 = SequenceService.get_current_number(db, 7, 'sale')
        current_product_6 = SequenceService.get_current_number(db, 6, 'product')
        
        if current_sale_6 == 2 and current_sale_7 == 1 and current_product_6 == 1:
            print("✅ Current number retrieval correct")
        else:
            print(f"❌ Current number retrieval failed: sale_6={current_sale_6}, sale_7={current_sale_7}, product_6={current_product_6}")
            return False
            
        print("🎉 Migration verification passed!")
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    verify_migration()
