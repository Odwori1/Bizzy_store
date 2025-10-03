from app.database import SessionLocal
from app.services.sequence_service import SequenceService

def test_product_sequence():
    db = SessionLocal()
    try:
        print("🧪 Testing Product Sequence Integration...")
        
        # Reset sequences for clean test
        SequenceService.initialize_sequence(db, 6, 'product', 0)
        
        # Test sequence generation for products
        product_num_6_1 = SequenceService.get_next_number(db, 6, 'product')
        product_num_6_2 = SequenceService.get_next_number(db, 6, 'product')
        product_num_7_1 = SequenceService.get_next_number(db, 7, 'product')
        
        print(f"✅ Business 6 Product Numbers: {product_num_6_1}, {product_num_6_2}")
        print(f"✅ Business 7 Product Number: {product_num_7_1}")
        
        # Verify business isolation
        if product_num_6_1 == 1 and product_num_6_2 == 2 and product_num_7_1 == 1:
            print("✅ Product business isolation working correctly")
        else:
            print("❌ Product business isolation failed")
            return False
            
        print("🎉 Product sequence integration test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    test_product_sequence()
