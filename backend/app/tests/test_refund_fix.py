import pytest
from sqlalchemy.orm import Session
from app.crud.refund import detect_and_fix_swapped_amounts, fix_existing_swapped_refunds
from app.models.refund import Refund

class TestRefundAmountFix:
    
    def test_detect_and_fix_swapped_amounts(self, db: Session):
        """Test that swapped amounts are detected and fixed correctly"""
        # Create a refund with swapped amounts (simulating the bug)
        refund = Refund(
            total_amount=0.0004,  # This should be the USD amount (~1.43)
            original_amount=1.43,  # This should be the UGX amount (~5000)
            original_currency="UGX"
        )
        
        # Apply the fix
        fixed_refund = detect_and_fix_swapped_amounts(refund)
        
        # Verify the amounts were swapped back
        assert fixed_refund.total_amount == 1.43
        assert fixed_refund.original_amount == 0.0004
        assert fixed_refund.original_currency == "UGX"
    
    def test_detect_and_fix_swapped_amounts_correct_data(self, db: Session):
        """Test that correct amounts are not modified"""
        # Create a refund with correct amounts
        refund = Refund(
            total_amount=1.43,     # Correct USD amount
            original_amount=5000,  # Correct UGX amount  
            original_currency="UGX"
        )
        
        # Apply the fix
        fixed_refund = detect_and_fix_swapped_amounts(refund)
        
        # Verify the amounts were not changed
        assert fixed_refund.total_amount == 1.43
        assert fixed_refund.original_amount == 5000
        assert fixed_refund.original_currency == "UGX"
    
    def test_detect_and_fix_swapped_amounts_edge_cases(self, db: Session):
        """Test edge cases for amount detection"""
        # Test with None values
        refund = Refund(
            total_amount=None,
            original_amount=None,
            original_currency="UGX"
        )
        fixed_refund = detect_and_fix_swapped_amounts(refund)
        assert fixed_refund.total_amount is None
        assert fixed_refund.original_amount is None
        
        # Test with zero values
        refund = Refund(
            total_amount=0,
            original_amount=0,
            original_currency="UGX"
        )
        fixed_refund = detect_and_fix_swapped_amounts(refund)
        assert fixed_refund.total_amount == 0
        assert fixed_refund.original_amount == 0
    
    def test_fix_existing_swapped_refunds(self, db: Session):
        """Test the bulk fix function"""
        # Create test refunds with swapped amounts
        refund1 = Refund(
            total_amount=0.0004,
            original_amount=1.43,
            original_currency="UGX"
        )
        refund2 = Refund(
            total_amount=0.0005, 
            original_amount=2.0,
            original_currency="USD"
        )
        
        db.add_all([refund1, refund2])
        db.commit()
        
        # Apply the bulk fix
        fixed_count = fix_existing_swapped_refunds(db)
        
        # Verify the fix was applied
        assert fixed_count == 2
        
        # Refresh and verify the data
        db.refresh(refund1)
        db.refresh(refund2)
        
        assert refund1.total_amount == 1.43
        assert refund1.original_amount == 0.0004
        assert refund2.total_amount == 2.0
        assert refund2.original_amount == 0.0005

# Integration test with the API
class TestRefundAPIWithFix:
    
    def test_get_refund_with_swapped_amounts(self, client, db: Session, refund_with_swapped_amounts):
        """Test that the API returns corrected amounts"""
        response = client.get(f"/api/refunds/{refund_with_swapped_amounts.id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # The API should return the corrected amounts
        assert data["total_amount"] == 1.43  # Should be the USD amount
        assert data["original_amount"] == 0.0004  # Should be the UGX amount
    
    def test_get_refunds_by_sale_with_fix(self, client, db: Session, sale_with_swapped_refunds):
        """Test that refunds by sale endpoint returns corrected amounts"""
        response = client.get(f"/api/refunds/sale/{sale_with_swapped_refunds.id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # All refunds should have corrected amounts
        for refund in data:
            assert refund["total_amount"] > 0.1  # USD amount should be reasonable
            assert refund["original_amount"] > 1  # UGX amount should be reasonable

@pytest.fixture
def refund_with_swapped_amounts(db: Session):
    """Fixture to create a refund with swapped amounts"""
    refund = Refund(
        sale_id=1,
        user_id=1,
        total_amount=0.0004,  # Swapped - should be USD amount
        original_amount=1.43, # Swapped - should be UGX amount
        original_currency="UGX",
        status="processed"
    )
    db.add(refund)
    db.commit()
    db.refresh(refund)
    return refund

@pytest.fixture  
def sale_with_swapped_refunds(db: Session):
    """Fixture to create a sale with refunds having swapped amounts"""
    from app.models.sale import Sale
    sale = Sale(id=999, total_amount=100, original_amount=350000, original_currency="UGX")
    db.add(sale)
    db.commit()
    
    # Create refunds with swapped amounts
    refund1 = Refund(sale_id=999, total_amount=0.0004, original_amount=1.43, original_currency="UGX")
    refund2 = Refund(sale_id=999, total_amount=0.0008, original_amount=2.86, original_currency="UGX")
    db.add_all([refund1, refund2])
    db.commit()
    
    return sale
