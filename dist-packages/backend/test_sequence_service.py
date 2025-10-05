from app.database import SessionLocal
from app.services.sequence_service import SequenceService

def test_sequence_service():
    db = SessionLocal()
    try:
        print("🧪 Testing Sequence Service...")
        
        # Test 1: Create new sequence
        next_num = SequenceService.get_next_number(db, 6, 'sale')
        print(f"✅ Test 1 - First sale number for business 6: {next_num}")
        assert next_num == 1, f"Expected 1, got {next_num}"
        
        # Test 2: Increment sequence
        next_num = SequenceService.get_next_number(db, 6, 'sale')
        print(f"✅ Test 2 - Second sale number for business 6: {next_num}")
        assert next_num == 2, f"Expected 2, got {next_num}"
        
        # Test 3: Different business should have independent sequence
        next_num = SequenceService.get_next_number(db, 7, 'sale')
        print(f"✅ Test 3 - First sale number for business 7: {next_num}")
        assert next_num == 1, f"Expected 1, got {next_num}"
        
        # Test 4: Different entity type should have independent sequence
        next_num = SequenceService.get_next_number(db, 6, 'product')
        print(f"✅ Test 4 - First product number for business 6: {next_num}")
        assert next_num == 1, f"Expected 1, got {next_num}"
        
        # Test 5: Get current number without incrementing
        current_num = SequenceService.get_current_number(db, 6, 'sale')
        print(f"✅ Test 5 - Current sale number for business 6: {current_num}")
        assert current_num == 2, f"Expected 2, got {current_num}"
        
        print("🎉 All sequence service tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_sequence_service()
