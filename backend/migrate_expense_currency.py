#!/usr/bin/env python3
"""
SAFE DATA MIGRATION SCRIPT: Convert existing expense amounts to USD.
This script is idempotent - running it multiple times won't cause issues.
"""

import asyncio
import sys
from decimal import Decimal
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database import get_db
from app.services.currency_service import CurrencyService

# Configuration - Use your actual DATABASE_URL from .env
DATABASE_URL = "postgresql://pos_user:0791486006@localhost/bizzy_pos_db"

# Hardcoded exchange rates as a FALLBACK in case the service fails
# These are approximate rates for safety. The script will try to get live rates first.
FALLBACK_RATES = {
    "UGX": 0.00028,  # 1 UGX = ~0.00028 USD
    "KES": 0.0078,   # 1 KES = ~0.0078 USD
    "USD": 1.0,      # 1 USD = 1 USD
    "EUR": 1.12,     # 1 EUR = ~1.12 USD
    "GBP": 1.30,     # 1 GBP = ~1.30 USD
}

async def migrate_expenses():
    print("🔧 Starting expense currency migration...")
    
    # Create database engine and session
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Step 1: Get all expenses that need migration
        result = db.execute(text("""
            SELECT id, amount, original_currency_code, original_amount 
            FROM expenses 
            WHERE original_currency_code IS NOT NULL
        """))
        expenses = result.fetchall()
        
        print(f"📊 Found {len(expenses)} expenses to migrate")
        
        if not expenses:
            print("✅ No expenses need migration")
            return
        
        # Step 2: Initialize currency service for live rates
        currency_service = CurrencyService(db)
        conversion_errors = []
        
        # Step 3: Process each expense
        for expense in expenses:
            expense_id, current_amount, original_currency, original_amount = expense
            
            # Skip if already in USD
            if original_currency == "USD":
                print(f"✅ Expense {expense_id}: Already USD ({original_amount})")
                continue
            
            # Try to get live exchange rate
            usd_amount = None
            try:
                # Try live conversion first
                usd_amount = await currency_service.convert_amount(
                    float(original_amount), 
                    original_currency, 
                    "USD"
                )
                print(f"🔁 Expense {expense_id}: {original_amount} {original_currency} -> {usd_amount:.2f} USD (Live rate)")
                
            except Exception as e:
                # Fallback to hardcoded rate if live conversion fails
                fallback_rate = FALLBACK_RATES.get(original_currency)
                if fallback_rate:
                    usd_amount = float(original_amount) * fallback_rate
                    print(f"⚠️  Expense {expense_id}: {original_amount} {original_currency} -> {usd_amount:.2f} USD (Fallback rate)")
                    conversion_errors.append(f"Expense {expense_id}: Used fallback rate for {original_currency}")
                else:
                    print(f"❌ Expense {expense_id}: No conversion rate available for {original_currency}")
                    conversion_errors.append(f"Expense {expense_id}: No rate for {original_currency}")
                    continue
            
            # Step 4: Update the expense with USD amount
            db.execute(
                text("UPDATE expenses SET amount = :usd_amount WHERE id = :expense_id"),
                {"usd_amount": usd_amount, "expense_id": expense_id}
            )
        
        # Commit all changes
        db.commit()
        print("✅ All conversions completed")
        
        if conversion_errors:
            print("\n⚠️  Conversion warnings:")
            for error in conversion_errors:
                print(f"   - {error}")
        
        # Step 5: Verification
        print("\n🔍 Verification:")
        result = db.execute(text("""
            SELECT id, amount, original_amount, original_currency_code 
            FROM expenses 
            WHERE original_currency_code != 'USD'
            LIMIT 5
        """))
        sample_expenses = result.fetchall()
        
        for expense in sample_expenses:
            expense_id, usd_amount, original_amount, original_currency = expense
            print(f"   Expense {expense_id}: {original_amount} {original_currency} -> {usd_amount:.2f} USD")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("💰 Expense Currency Migration Script")
    print("=====================================")
    print("This script will:")
    print("1. Convert all expense amounts to USD")
    print("2. Preserve original amounts for audit purposes")
    print("3. Use live exchange rates with fallback values")
    print()
    
    response = input("Do you want to continue? (yes/no): ").strip().lower()
    if response in ['y', 'yes']:
        asyncio.run(migrate_expenses())
    else:
        print("Migration cancelled")
        sys.exit(0)
