#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/odwori/Bizzy_store/backend')

from app.database import get_db
from app.crud.report import get_financial_report
from datetime import date

# Get database session
db_gen = get_db()
db = next(db_gen)

try:
    # Call the function directly
    report = get_financial_report(db, date(2025, 8, 20), date(2025, 9, 19))
    
    # Check if primary_currency exists in summary
    summary = report.get('summary', {})
    print("Primary currency in summary:", 'primary_currency' in summary)
    print("Primary currency value:", summary.get('primary_currency', 'MISSING'))
    print("All summary keys:", list(summary.keys()))
    
finally:
    db.close()
