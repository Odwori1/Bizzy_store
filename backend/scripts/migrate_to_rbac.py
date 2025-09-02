#!/usr/bin/env python3
"""
Script to populate the new RBAC tables with default data and migrate existing users.
This should be run once after the alembic migration that creates the tables.
"""

import sys
import os
from sqlalchemy.orm import Session

# Add the app directory to the Python path so we can import our models
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal, engine, get_db
from app.models.permission import Permission, Role
from app.models.user import User

# A comprehensive list of permissions for the entire application
# This defines what actions can be controlled in the system
DEFAULT_PERMISSIONS = [
    # Sales & POS
    {"name": "sale:create", "description": "Create a new sale/transaction"},
    {"name": "sale:read", "description": "View sales history"},
    {"name": "sale:refund", "description": "Process refunds for sales"},
    {"name": "sale:delete", "description": "Delete sales records"},

    # Products
    {"name": "product:create", "description": "Create new products"},
    {"name": "product:read", "description": "View products"},
    {"name": "product:update", "description": "Edit existing products"},
    {"name": "product:delete", "description": "Delete products"},

    # Inventory
    {"name": "inventory:read", "description": "View inventory levels"},
    {"name": "inventory:update", "description": "Update inventory counts"},

    # Customers
    {"name": "customer:create", "description": "Create new customer profiles"},
    {"name": "customer:read", "description": "View customer information"},
    {"name": "customer:update", "description": "Edit customer information"},
    {"name": "customer:delete", "description": "Delete customer records"},

    # Suppliers & Purchasing
    {"name": "supplier:create", "description": "Create new suppliers"},
    {"name": "supplier:read", "description": "View suppliers"},
    {"name": "supplier:update", "description": "Edit suppliers"},
    {"name": "supplier:delete", "description": "Delete suppliers"},
    {"name": "purchase_order:create", "description": "Create purchase orders"},
    {"name": "purchase_order:read", "description": "View purchase orders"},
    {"name": "purchase_order:update", "description": "Edit purchase orders"},
    {"name": "purchase_order:delete", "description": "Delete purchase orders"},
    {"name": "purchase_order:receive", "description": "Receive purchase order items"},

    # Users & Permissions
    {"name": "user:create", "description": "Create new users"},
    {"name": "user:read", "description": "View users"},
    {"name": "user:update", "description": "Edit users"},
    {"name": "user:delete", "description": "Delete users"},
    {"name": "role:manage", "description": "Manage roles and permissions"},

    # Business & Reports
    {"name": "business:update", "description": "Update business settings"},
    {"name": "report:view", "description": "View all reports"},
]

# Definition of default roles and the permissions they should have
DEFAULT_ROLES = {
    "Owner": {
        "description": "Has full access to all features and administrative functions",
        "is_default": False,
        "permissions": [perm["name"] for perm in DEFAULT_PERMISSIONS]  # Owner gets EVERY permission
    },
    "Manager": {
        "description": "Can manage products, inventory, sales, and reports but not user permissions",
        "is_default": False,
        "permissions": [
            "sale:create", "sale:read", "sale:refund",
            "product:create", "product:read", "product:update",
            "inventory:read", "inventory:update",
            "customer:create", "customer:read", "customer:update",
            "supplier:create", "supplier:read", "supplier:update",
            "purchase_order:create", "purchase_order:read", "purchase_order:update", "purchase_order:receive",
            "report:view"
        ]
    },
    "Cashier": {
        "description": "Can process sales and view basic product information",
        "is_default": True,  # This is the default role for new users
        "permissions": [
            "sale:create",
            "product:read",
            "customer:create", "customer:read"
        ]
    }
}

def migrate_data(db: Session):
    """Populate the RBAC tables with default data"""
    print("Starting RBAC data migration...")
    
    # 1. Create all permissions
    print("Creating permissions...")
    for perm_data in DEFAULT_PERMISSIONS:
        permission = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
        if not permission:
            permission = Permission(**perm_data)
            db.add(permission)
    db.commit()
    print(f"Created {len(DEFAULT_PERMISSIONS)} permissions")
    
    # 2. Create roles and assign permissions
    print("Creating roles and assigning permissions...")
    role_objects = {}
    for role_name, role_data in DEFAULT_ROLES.items():
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            role = Role(
                name=role_name,
                description=role_data["description"],
                is_default=role_data["is_default"]
            )
            db.add(role)
            db.flush()  # Flush to get the role ID without committing
        
        # Clear existing permissions and assign new ones
        role.permissions = []
        for perm_name in role_data["permissions"]:
            permission = db.query(Permission).filter(Permission.name == perm_name).first()
            if permission:
                role.permissions.append(permission)
        
        role_objects[role_name] = role
        print(f"Created role '{role_name}' with {len(role_data['permissions'])} permissions")
    
    db.commit()
    
    # 3. Migrate existing users based on their old role
    print("Migrating existing users...")
    users = db.query(User).all()
    for user in users:
        # For now, we can't determine their old role because the column was dropped.
        # We will assign all existing users to the "Cashier" role as a safe default.
        # The business owner can later reassign roles through the new admin UI.
        if not user.roles:  # If user has no roles assigned
            cashier_role = role_objects.get("Cashier")
            if cashier_role:
                user.roles.append(cashier_role)
                print(f"Assigned user '{user.username}' to 'Cashier' role")
    
    db.commit()
    print("Data migration completed successfully!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        migrate_data(db)
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()
