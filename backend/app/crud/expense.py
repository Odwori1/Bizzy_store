from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.models.expense import Expense
from app.schemas.expense_schema import ExpenseCreate  # Import the schema to use its model

def create_expense(db: Session, expense_data: ExpenseCreate, user_id: int, usd_amount: float, exchange_rate: Optional[float] = None):
    """
    Create a new expense with multi-currency support.
    Saves the original amount, original currency, and the calculated USD amount.
    """
    db_expense = Expense(
        # These are the calculated values for internal use
        amount=usd_amount,  # The calculated USD amount
        exchange_rate=exchange_rate, # The rate used for the conversion

        # These are the original user inputs to preserve intent
        original_amount=expense_data.original_amount,
        original_currency_code=expense_data.original_currency_code,

        # These are the other required fields
        description=expense_data.description,
        category_id=expense_data.category_id,
        business_id=expense_data.business_id,
        payment_method=getattr(expense_data, 'payment_method', 'cash'),
        is_recurring=getattr(expense_data, 'is_recurring', False),
        recurrence_interval=getattr(expense_data, 'recurrence_interval', None),
        receipt_url=getattr(expense_data, 'receipt_url', None),
        created_by=user_id
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def get_business_expenses(db: Session, business_id: int,
                         start_date: Optional[datetime] = None,
                         end_date: Optional[datetime] = None):
    """Get expenses for a business with optional date filtering"""
    query = db.query(Expense).filter(Expense.business_id == business_id)

    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)

    return query.order_by(Expense.date.desc()).all()

def delete_expense(db: Session, expense_id: int):
    """Delete an expense"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if expense:
        db.delete(expense)
        db.commit()
    return expense

# ===== EXPENSE CATEGORY CRUD FUNCTIONS =====
from app.models.expense import ExpenseCategory
from app.schemas.expense_schema import ExpenseCategoryCreate

def get_expense_categories(db: Session) -> List[ExpenseCategory]:
    """Get all expense categories"""
    return db.query(ExpenseCategory).filter(ExpenseCategory.is_active == True).all()

def get_expense_category(db: Session, category_id: int) -> Optional[ExpenseCategory]:
    """Get a specific expense category by ID"""
    return db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()

def create_expense_category(db: Session, category_data: ExpenseCategoryCreate) -> ExpenseCategory:
    """Create a new expense category"""
    db_category = ExpenseCategory(
        name=category_data.name,
        description=category_data.description
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_expense_category(db: Session, category_id: int, category_data: ExpenseCategoryCreate) -> Optional[ExpenseCategory]:
    """Update an existing expense category"""
    category = db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()
    if category:
        category.name = category_data.name
        category.description = category_data.description
        db.commit()
        db.refresh(category)
    return category

def delete_expense_category(db: Session, category_id: int) -> bool:
    """Soft delete an expense category (set is_active to False)"""
    category = db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()
    if category:
        category.is_active = False
        db.commit()
        return True
    return False
