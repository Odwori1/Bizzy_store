# ~/Bizzy_store/backend/test_working_crud.py
from app.database import SessionLocal
from app.models.sale import Sale
from app.models.refund import Refund
from app.models.expense import Expense
from app.models.product import Product
from app.models.business_sequence import BusinessSequence
from app.crud.sale import create_sale
from app.crud.refund import process_refund
from app.crud.expense import create_expense
from app.crud.product import create_product
from app.schemas.sale_schema import SaleCreate, SaleItemCreate, PaymentCreate
from app.schemas.refund_schema import RefundCreate, RefundItemCreate
from app.schemas.expense_schema import ExpenseCreate
from app.schemas.product_schema import ProductCreate
from sqlalchemy import func
from datetime import datetime

def test_with_real_users():
    """Test CRUD operations with users that actually have businesses"""
    print("🧪 TESTING WITH REAL USERS")
    print("=" * 40)
    
    db = SessionLocal()
    
    try:
        # Use User 14 (mama namu) who has Business 6
        TEST_USER_ID = 14
        TEST_BUSINESS_ID = 6
        
        print(f"Using User {TEST_USER_ID} with Business {TEST_BUSINESS_ID}")
        
        # Test 1: Create a product
        print("\n1. TESTING PRODUCT CREATION...")
        try:
            product_data = ProductCreate(
                name="Test Product - Real User",
                description="Testing with real user business association",
                price=150.0,
                cost_price=75.0,
                barcode="TEST_REAL_USER_001",
                stock_quantity=50,
                min_stock_level=10
            )
            
            product = create_product(db, product_data, user_id=TEST_USER_ID, business_id=TEST_BUSINESS_ID)
            print(f"   ✅ Product created: #{product.business_product_number}")
            
        except Exception as e:
            print(f"   ❌ Product creation failed: {e}")
        
        # Test 2: Create an expense
        print("\n2. TESTING EXPENSE CREATION...")
        try:
            expense_data = ExpenseCreate(
                description="Test Expense - Real User",
                original_amount=250.0,
                original_currency_code="USD",
                category_id=1,
                business_id=TEST_BUSINESS_ID
            )
            
            expense = create_expense(db, expense_data, user_id=TEST_USER_ID, usd_amount=250.0)
            print(f"   ✅ Expense created: #{expense.business_expense_number}")
            
        except Exception as e:
            print(f"   ❌ Expense creation failed: {e}")
        
        # Test 3: Check sequences
        print("\n3. CHECKING SEQUENCES...")
        for entity_type in ['sale', 'refund', 'product', 'expense']:
            seq = db.query(BusinessSequence).filter(
                BusinessSequence.business_id == TEST_BUSINESS_ID,
                BusinessSequence.entity_type == entity_type
            ).first()
            if seq:
                print(f"   📊 {entity_type.upper()} sequence: {seq.last_number}")
        
        # Test 4: Verify no gaps in sales
        print("\n4. CHECKING FOR GAPS...")
        sales = db.query(Sale.business_sale_number).filter(
            Sale.business_id == TEST_BUSINESS_ID
        ).order_by(Sale.business_sale_number).all()
        
        sales_numbers = [s[0] for s in sales]
        print(f"   📊 Sales sequence: {sales_numbers}")
        
        # Detect gaps
        expected = 1
        gaps = []
        for num in sales_numbers:
            if num != expected:
                gaps.append((expected, num))
            expected = num + 1
        
        if gaps:
            print(f"   ⚠️  Found gaps: {gaps}")
        else:
            print("   ✅ No gaps in sales sequence")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def check_all_business_sequences():
    """Check sequence consistency across all businesses"""
    print("\n🏢 CHECKING ALL BUSINESS SEQUENCES")
    print("=" * 40)
    
    db = SessionLocal()
    
    try:
        # Get all businesses with their sequences
        from app.models.business import Business
        
        businesses = db.query(Business).all()
        
        for business in businesses:
            print(f"\nBusiness {business.id}: {business.name}")
            
            for entity_type in ['sale', 'refund', 'product', 'expense']:
                # Get sequence value
                seq = db.query(BusinessSequence).filter(
                    BusinessSequence.business_id == business.id,
                    BusinessSequence.entity_type == entity_type
                ).first()
                
                # Get actual max business number
                if entity_type == 'sale':
                    actual_max = db.query(func.max(Sale.business_sale_number)).filter(
                        Sale.business_id == business.id
                    ).scalar() or 0
                elif entity_type == 'refund':
                    actual_max = db.query(func.max(Refund.business_refund_number)).filter(
                        Refund.business_id == business.id
                    ).scalar() or 0
                elif entity_type == 'product':
                    actual_max = db.query(func.max(Product.business_product_number)).filter(
                        Product.business_id == business.id
                    ).scalar() or 0
                elif entity_type == 'expense':
                    actual_max = db.query(func.max(Expense.business_expense_number)).filter(
                        Expense.business_id == business.id
                    ).scalar() or 0
                else:
                    actual_max = 0
                
                seq_value = seq.last_number if seq else 0
                status = "✅" if seq_value >= actual_max else "❌"
                print(f"   {entity_type.upper()}: Seq={seq_value}, Max={actual_max} {status}")
                
    except Exception as e:
        print(f"❌ Check failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_with_real_users()
    check_all_business_sequences()
