from app.database import SessionLocal
from app.services.sequence_service import SequenceService

def test_sale_sequence():
    db = SessionLocal()
    try:
        print("🧪 Testing Sale Sequence Integration...")
        
        # Reset sequences for clean test
        SequenceService.initialize_sequence(db, 6, 'sale', 0)
        SequenceService.initialize_sequence(db, 7, 'sale', 0)
        
        # Test sequence generation for sales
        sale_num_6_1 = SequenceService.get_next_number(db, 6, 'sale')
        sale_num_6_2 = SequenceService.get_next_number(db, 6, 'sale')
        sale_num_7_1 = SequenceService.get_next_number(db, 7, 'sale')
        
        print(f"✅ Business 6 Sale Numbers: {sale_num_6_1}, {sale_num_6_2}")
        print(f"✅ Business 7 Sale Number: {sale_num_7_1}")
        
        # Verify business isolation
        if sale_num_6_1 == 1 and sale_num_6_2 == 2 and sale_num_7_1 == 1:
            print("✅ Business isolation working correctly")
        else:
            print("❌ Business isolation failed")
            return False
            
        print("🎉 Sale sequence integration test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    test_sale_sequence()
