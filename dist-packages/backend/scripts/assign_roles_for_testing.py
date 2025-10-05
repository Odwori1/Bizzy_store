#!/usr/bin/env python3
"""
Script to assign specific roles to users for testing the new permission system.
"""

import sys
import os
from sqlalchemy.orm import Session

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal
from app.models.user import User
from app.models.permission import Role

def assign_test_roles():
    db = SessionLocal()
    try:
        print("Assigning roles for testing...")
        
        # Get the roles from the database
        owner_role = db.query(Role).filter(Role.name == "Owner").first()
        cashier_role = db.query(Role).filter(Role.name == "Cashier").first()
        
        if not owner_role or not cashier_role:
            print("Error: Required roles not found in database. Run migrate_to_rbac.py first.")
            return
        
        # Find or create test users
        # Test Owner account
        owner_user = db.query(User).filter(User.username == "test_owner").first()
        if not owner_user:
            print("Creating test_owner user...")
            owner_user = User(
                username="test_owner",
                email="test_owner@bizzy.com",
                hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # password = "secret"
                is_active=True
            )
            db.add(owner_user)
            db.flush()
        
        # Test Cashier account  
        cashier_user = db.query(User).filter(User.username == "test_cashier").first()
        if not cashier_user:
            print("Creating test_cashier user...")
            cashier_user = User(
                username="test_cashier",
                email="test_cashier@bizzy.com",
                hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # password = "secret"
                is_active=True
            )
            db.add(cashier_user)
            db.flush()
        
        # Assign roles
        owner_user.roles = [owner_role]
        cashier_user.roles = [cashier_role]
        
        db.commit()
        print("Successfully assigned roles:")
        print(f"- test_owner: {[r.name for r in owner_user.roles]}")
        print(f"- test_cashier: {[r.name for r in cashier_user.roles]}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    assign_test_roles()
