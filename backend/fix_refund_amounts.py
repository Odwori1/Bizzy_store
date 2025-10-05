#!/usr/bin/env python3
"""
Migration script to fix swapped refund amounts in the database.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.refund import Refund

def fix_existing_swapped_refunds(db):
    """Fix all existing refunds in the database that have swapped amounts"""
    all_refunds = db.query(Refund).all()
    print(f"🔍 Found {len(all_refunds)} total refunds")
    
    fixed_count = 0
    for refund in all_refunds:
        print(f"Checking refund {refund.id}: total={refund.total_amount}, original={refund.original_amount}")
        
        # Specific fix for refund #1 - we know the exact correct values from sale #9
        if refund.id == 1:
            print(f"🔄 Applying specific fix for refund #1")
            refund.total_amount = 1.4271578829203955  # Correct USD amount from sale
            refund.original_amount = 5000.0  # Correct UGX amount from sale
            fixed_count += 1
        # General detection for other refunds
        elif (refund.original_amount is not None and refund.total_amount is not None and
              refund.original_amount < 1 and refund.total_amount > 0.1):
            print(f"🔄 Fixing swapped amounts for refund {refund.id}")
            refund.total_amount, refund.original_amount = refund.original_amount, refund.total_amount
            fixed_count += 1
    
    if fixed_count > 0:
        db.commit()
        print(f"✅ Fixed {fixed_count} refunds with swapped amounts")
    else:
        print("ℹ️ No refunds needed fixing")
    
    return fixed_count

def main():
    """Run the refund amount fix migration"""
    db = SessionLocal()
    try:
        print("🔧 Starting refund amount fix migration...")
        fixed_count = fix_existing_swapped_refunds(db)
        print(f"🎉 Migration completed! Fixed {fixed_count} refund records.")
        
        # Verify the fix
        print("\n🔍 Verifying the fix:")
        refunds = db.query(Refund).all()
        for refund in refunds:
            print(f"Refund {refund.id}: total_amount={refund.total_amount}, original_amount={refund.original_amount}")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
