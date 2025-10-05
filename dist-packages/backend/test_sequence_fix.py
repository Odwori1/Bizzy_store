# ~/Bizzy_store/backend/test_sequence_fix.py
from app.database import SessionLocal
from app.services.sequence_service import SequenceService

def test_sequence_fix():
    """Test that the fixed sequence service works correctly"""
    print("🧪 TESTING FIXED SEQUENCE SERVICE")
    
    db = SessionLocal()
    
    try:
        TEST_BUSINESS_ID = 6
        
        print("1. Testing sequence generation within transaction...")
        
        # Get current sequence
        current = SequenceService.get_current_number(db, TEST_BUSINESS_ID, 'product')
        print(f"   Current product sequence: {current}")
        
        # Get next number (should NOT commit separately)
        next_num = SequenceService.get_next_number(db, TEST_BUSINESS_ID, 'product')
        print(f"   Next product sequence: {next_num}")
        
        # Rollback to test if sequence increment was transactional
        db.rollback()
        print("   ✅ Transaction rolled back")
        
        # Get number again (should be the same as before if fix worked)
        after_rollback = SequenceService.get_next_number(db, TEST_BUSINESS_ID, 'product')
        db.commit()
        
        if after_rollback == next_num:
            print("   ✅ Sequence increment was transactional (rolled back properly)")
        else:
            print(f"   ❌ Sequence not transactional: {after_rollback} vs {next_num}")
            
        print(f"   Final committed sequence: {after_rollback}")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_sequence_fix()
