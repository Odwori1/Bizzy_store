#!/usr/bin/env python3
"""
Surgical Monitor Script for the Database Migration.
Run this in a separate terminal to catch errors instantly.
"""
import sys
import os

# Add the app directory to the path so we can import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

try:
    # TEST 1: Can we import the models without syntax errors?
    from models.base import Base
    from models.user import User
    from models.business import Business
    from models.currency import Currency
    print("✅ SUCCESS: All model imports passed.")
    
    # TEST 2: Can we create the engine and reflect tables? (This will catch SQLAlchemy schema issues)
    from database import engine
    # This will throw an error if relationships are broken
    # We just test reflection, don't create all tables
    Base.metadata.reflect(engine) 
    print("✅ SUCCESS: Database metadata is valid.")
    
except Exception as e:
    print(f"❌ FAILED: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
