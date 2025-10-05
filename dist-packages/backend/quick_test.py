# quick_test.py
from app.database import SessionLocal
from app.models.refund import Refund

def test_refund_fix():
    db = SessionLocal()
    try:
        refund = db.query(Refund).filter(Refund.id == 1).first()
        if refund:
            print(f"Before fix: total={refund.total_amount}, original={refund.original_amount}")
            
            # The amounts should now be correct
            assert refund.total_amount == 1.4271578829203955, f"Expected 1.427, got {refund.total_amount}"
            assert refund.original_amount == 5000.0, f"Expected 5000, got {refund.original_amount}"
            
            print("✅ Refund amounts are correct!")
        else:
            print("❌ Refund #1 not found")
    finally:
        db.close()

if __name__ == "__main__":
    test_refund_fix()
