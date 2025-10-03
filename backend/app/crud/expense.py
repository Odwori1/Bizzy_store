# ~/Bizzy_store/backend/app/crud/expense.py - COMPLETE FIXED VERSION
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.models.expense import Expense
from app.schemas.expense_schema import ExpenseCreate
from app.crud.business import get_business_by_user_id
from app.services.sequence_service import SequenceService
from app.models.expense import ExpenseCategory
from app.schemas.expense_schema import ExpenseCategoryCreate

def create_expense(db: Session, expense_data, user_id: int, usd_amount: float, exchange_rate: Optional[float] = None):
    """Create a new expense with multi-currency support - FIXED VERSION"""
    try:
        # Get business context for currency
        business = get_business_by_user_id(db, user_id)
        if not business:
            raise ValueError("User business not found")
            
        business_currency = business.currency_code if business else 'USD'

        # FIXED PATTERN: Get sequence number FIRST, then create record
        business_expense_number = SequenceService.get_next_number(db, expense_data.business_id, 'expense')

        db_expense = Expense(
            # These are the calculated values for internal use
            amount=usd_amount,
            exchange_rate=exchange_rate,

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
            created_by=user_id,

            # Use the sequence number we already obtained
            business_expense_number=business_expense_number
        )
        db.add(db_expense)
        db.commit()
        db.refresh(db_expense)
        return db_expense
    except Exception as e:
        db.rollback()
        raise e

def get_business_expenses(db: Session, business_id: int,
                          start_date: Optional[datetime] = None,
                          end_date: Optional[datetime] = None):
    """Get expenses for a business with optional date filtering"""
    query = db.query(
        Expense,
        ExpenseCategory.name.label('category_name')
    ).join(
        ExpenseCategory, Expense.category_id == ExpenseCategory.id
    ).filter(
        Expense.business_id == business_id,
        ExpenseCategory.is_active == True
    )

    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)

    results = query.order_by(Expense.date.desc()).all()
    expenses_with_category = []
    for expense, category_name in results:
        expense_with_category = expense
        expense_with_category.category_name = category_name
        expenses_with_category.append(expense_with_category)
    return expenses_with_category

def delete_expense(db: Session, expense_id: int):
    """Delete an expense"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if expense:
        db.delete(expense)
        db.commit()
    return expense

# Expense Category CRUD functions remain the same
def get_expense_categories(db: Session) -> List[ExpenseCategory]:
    return db.query(ExpenseCategory).filter(ExpenseCategory.is_active == True).all()

def get_expense_category(db: Session, category_id: int) -> Optional[ExpenseCategory]:
    return db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()

def create_expense_category(db: Session, category_data: ExpenseCategoryCreate) -> ExpenseCategory:
    db_category = ExpenseCategory(
        name=category_data.name,
        description=category_data.description
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_expense_category(db: Session, category_id: int, category_data: ExpenseCategoryCreate) -> Optional[ExpenseCategory]:
    category = db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()
    if category:
        category.name = category_data.name
        category.description = category_data.description
        db.commit()
        db.refresh(category)
    return category

def delete_expense_category(db: Session, category_id: int) -> bool:
    category = db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()
    if category:
        category.is_active = False
        db.commit()
        return True
    return False
