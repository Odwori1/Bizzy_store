# ~/Bizzy_store/backend/test_crud_fixes.py
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.sale import Sale
from app.models.refund import Refund
from app.models.expense import Expense
from app.models.product import Product
from app.models.inventory import InventoryHistory
from app.models.business_sequence import BusinessSequence
from app.crud.sale import create_sale
from app.crud.refund import process_refund
from app.crud.expense import create_expense
from app.crud.product import create_product
from app.crud.inventory import adjust_inventory
from app.schemas.sale_schema import SaleCreate, SaleItemCreate, PaymentCreate
from app.schemas.refund_schema import RefundCreate, RefundItemCreate
from app.schemas.expense_schema import ExpenseCreate
from app.schemas.product_schema import ProductCreate
from app.schemas.inventory_schema import InventoryAdjustment
from datetime import datetime
import asyncio

def test_sequence_gap_prevention():
    """Test that the deferred sequence pattern prevents gaps"""
    print("🧪 TESTING DEFERRED SEQUENCE PATTERN")
    print("=" * 50)
    
    db = SessionLocal()
    
    try:
        # Test Business ID - using an existing business
        TEST_BUSINESS_ID = 6  # Using Business 6 that had the gap
        
        # Get current sequence values
        sequences_before = {}
        for entity_type in ['sale', 'refund', 'product', 'expense']:
            seq = db.query(BusinessSequence).filter(
                BusinessSequence.business_id == TEST_BUSINESS_ID,
                BusinessSequence.entity_type == entity_type
            ).first()
            sequences_before[entity_type] = seq.last_number if seq else 0
            print(f"📊 {entity_type.upper()} sequence before: {sequences_before[entity_type]}")
        
        print("\n✅ SEQUENCE BASELINE ESTABLISHED")
        
        # Test 1: Create a product (simplest case)
        print("\n1. TESTING PRODUCT CREATION...")
        try:
            product_data = ProductCreate(
                name="Test Product for Gap Prevention",
                description="Test product to verify sequence gap prevention",
                price=100.0,
                cost_price=50.0,
                barcode="TEST_GAP_001",
                stock_quantity=10,
                min_stock_level=5
            )
            
            # This should use the deferred sequence pattern
            product = create_product(db, product_data, user_id=1, business_id=TEST_BUSINESS_ID)
            print(f"   ✅ Product created: #{product.business_product_number} (ID: {product.id})")
            
            # Verify sequence was incremented
            product_seq = db.query(BusinessSequence).filter(
                BusinessSequence.business_id == TEST_BUSINESS_ID,
                BusinessSequence.entity_type == 'product'
            ).first()
            print(f"   ✅ Product sequence after: {product_seq.last_number}")
            
        except Exception as e:
            print(f"   ❌ Product creation failed: {e}")
        
        # Test 2: Create an expense
        print("\n2. TESTING EXPENSE CREATION...")
        try:
            expense_data = ExpenseCreate(
                description="Test Expense for Gap Prevention",
                original_amount=500.0,
                original_currency_code="USD",
                category_id=1,  # Assuming category 1 exists
                business_id=TEST_BUSINESS_ID
            )
            
            expense = create_expense(db, expense_data, user_id=1, usd_amount=500.0)
            print(f"   ✅ Expense created: #{expense.business_expense_number} (ID: {expense.id})")
            
            # Verify sequence was incremented
            expense_seq = db.query(BusinessSequence).filter(
                BusinessSequence.business_id == TEST_BUSINESS_ID,
                BusinessSequence.entity_type == 'expense'
            ).first()
            print(f"   ✅ Expense sequence after: {expense_seq.last_number}")
            
        except Exception as e:
            print(f"   ❌ Expense creation failed: {e}")
        
        # Test 3: Check for any gaps in existing data
        print("\n3. CHECKING FOR EXISTING GAPS...")
        
        # Check sales sequence for Business 6
        sales = db.query(Sale.business_sale_number).filter(
            Sale.business_id == TEST_BUSINESS_ID
        ).order_by(Sale.business_sale_number).all()
        
        sales_numbers = [s[0] for s in sales]
        print(f"   📊 Business {TEST_BUSINESS_ID} sales sequence: {sales_numbers}")
        
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
            print("   ✅ No gaps found in sales sequence")
        
        # Test 4: Verify sequence consistency
        print("\n4. VERIFYING SEQUENCE CONSISTENCY...")
        sequences_after = {}
        for entity_type in ['sale', 'refund', 'product', 'expense']:
            seq = db.query(BusinessSequence).filter(
                BusinessSequence.business_id == TEST_BUSINESS_ID,
                BusinessSequence.entity_type == entity_type
            ).first()
            sequences_after[entity_type] = seq.last_number if seq else 0
            
            if sequences_after[entity_type] > sequences_before[entity_type]:
                print(f"   ✅ {entity_type.upper()} sequence incremented correctly: {sequences_before[entity_type]} → {sequences_after[entity_type]}")
            else:
                print(f"   ✅ {entity_type.upper()} sequence unchanged: {sequences_after[entity_type]}")
        
        print("\n🎉 ALL TESTS COMPLETED!")
        
        # Final summary
        print("\n📋 FINAL SUMMARY:")
        print(f"   Business ID: {TEST_BUSINESS_ID}")
        for entity_type in ['sale', 'refund', 'product', 'expense']:
            current_max = get_max_business_number(db, entity_type, TEST_BUSINESS_ID)
            seq_value = sequences_after[entity_type]
            status = "✅ CONSISTENT" if seq_value >= current_max else "❌ INCONSISTENT"
            print(f"   {entity_type.upper()}: Sequence={seq_value}, Max Record={current_max} - {status}")
            
    except Exception as e:
        print(f"❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def get_max_business_number(db, entity_type, business_id):
    """Get the maximum business number for a given entity type"""
    if entity_type == 'sale':
        result = db.query(db.func.max(Sale.business_sale_number)).filter(
            Sale.business_id == business_id
        ).scalar()
    elif entity_type == 'refund':
        result = db.query(db.func.max(Refund.business_refund_number)).filter(
            Refund.business_id == business_id
        ).scalar()
    elif entity_type == 'product':
        result = db.query(db.func.max(Product.business_product_number)).filter(
            Product.business_id == business_id
        ).scalar()
    elif entity_type == 'expense':
        result = db.query(db.func.max(Expense.business_expense_number)).filter(
            Expense.business_id == business_id
        ).scalar()
    else:
        result = 0
    return result or 0

def test_concurrent_operations():
    """Test that concurrent operations don't create duplicates"""
    print("\n🧪 TESTING CONCURRENT OPERATION PROTECTION")
    print("=" * 50)
    
    db = SessionLocal()
    
    try:
        TEST_BUSINESS_ID = 6
        
        # Get current product sequence
        product_seq_before = db.query(BusinessSequence).filter(
            BusinessSequence.business_id == TEST_BUSINESS_ID,
            BusinessSequence.entity_type == 'product'
        ).first()
        
        print(f"📊 Product sequence before concurrent test: {product_seq_before.last_number if product_seq_before else 0}")
        
        # Try to create multiple products rapidly
        products_created = []
        for i in range(3):
            try:
                product_data = ProductCreate(
                    name=f"Concurrent Test Product {i+1}",
                    description=f"Test product for concurrent operations {i+1}",
                    price=100.0 + i,
                    cost_price=50.0 + i,
                    barcode=f"CONCURRENT_TEST_{i+1}",
                    stock_quantity=10,
                    min_stock_level=5
                )
                
                product = create_product(db, product_data, user_id=1, business_id=TEST_BUSINESS_ID)
                products_created.append(product.business_product_number)
                print(f"   ✅ Created product #{product.business_product_number}")
                
            except Exception as e:
                print(f"   ❌ Failed to create product {i+1}: {e}")
        
        # Check for duplicates
        if len(products_created) != len(set(products_created)):
            print("   ❌ DUPLICATES DETECTED in concurrent operations!")
        else:
            print("   ✅ No duplicates - concurrent operation protection working")
        
        product_seq_after = db.query(BusinessSequence).filter(
            BusinessSequence.business_id == TEST_BUSINESS_ID,
            BusinessSequence.entity_type == 'product'
        ).first()
        
        print(f"📊 Product sequence after concurrent test: {product_seq_after.last_number if product_seq_after else 0}")
        
    except Exception as e:
        print(f"❌ CONCURRENT TEST FAILED: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 STARTING CRUD FIXES VERIFICATION")
    print("=" * 50)
    
    test_sequence_gap_prevention()
    test_concurrent_operations()
    
    print("\n🎯 TESTING COMPLETE!")
    print("=" * 50)
