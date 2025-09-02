#!/usr/bin/env python3
from app.database import SessionLocal
from app.models.expense import ExpenseCategory

def init_expense_categories():
    db = SessionLocal()
    
    default_categories = [
        {"name": "Rent", "description": "Store rental costs"},
        {"name": "Utilities", "description": "Electricity, water, internet"},
        {"name": "Salaries", "description": "Staff salaries and wages"},
        {"name": "Inventory", "description": "Product purchases and restocking"},
        {"name": "Marketing", "description": "Advertising and promotions"},
        {"name": "Maintenance", "description": "Equipment and facility maintenance"},
        {"name": "Office Supplies", "description": "Stationery and office materials"},
        {"name": "Transportation", "description": "Delivery and transportation costs"},
        {"name": "Taxes", "description": "Business taxes and fees"},
        {"name": "Miscellaneous", "description": "Other expenses"},
    ]
    
    for cat_data in default_categories:
        category = db.query(ExpenseCategory).filter(ExpenseCategory.name == cat_data["name"]).first()
        if not category:
            category = ExpenseCategory(**cat_data)
            db.add(category)
    
    db.commit()
    db.close()
    print("✓ Expense categories initialized")

if __name__ == "__main__":
    init_expense_categories()
