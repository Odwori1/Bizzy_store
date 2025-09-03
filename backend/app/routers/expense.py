from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.expense import Expense, ExpenseCategory
from app.schemas.expense_schema import ExpenseCreate, Expense as ExpenseSchema, ExpenseCategoryCreate, ExpenseCategory as ExpenseCategorySchema
from app.core.auth import get_current_user
from app.models.user import User  # Import the User model at the top of the file if it's not already there

router = APIRouter(prefix="/api/expenses", tags=["expenses"])

@router.get("/categories/", response_model=List[ExpenseCategorySchema])
def get_expense_categories(db: Session = Depends(get_db)):
    """Get all expense categories"""
    return db.query(ExpenseCategory).filter(ExpenseCategory.is_active == True).all()

@router.post("/categories/", response_model=ExpenseCategorySchema)
def create_expense_category(category: ExpenseCategoryCreate, db: Session = Depends(get_db)):
    """Create a new expense category"""
    # Check if category already exists
    existing = db.query(ExpenseCategory).filter(ExpenseCategory.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    db_category = ExpenseCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/", response_model=List[ExpenseSchema])
def get_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get all expenses for the current user's business"""
    # Get user's business
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user or not user.business_id:
        raise HTTPException(status_code=404, detail="User business not found")
    
    # Query expenses for the user's business
    expenses = db.query(Expense).filter(Expense.business_id == user.business_id).offset(skip).limit(limit).all()
    return expenses  # <-- This line was missing!

@router.post("/", response_model=ExpenseSchema)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Create a new expense"""
    # Verify category exists
    category = db.query(ExpenseCategory).filter(ExpenseCategory.id == expense.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Verify business exists and user has access
    from app.models.business import Business
    business = db.query(Business).filter(Business.id == expense.business_id).first()
    if not business or business.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Business not found or access denied")

    db_expense = Expense(**expense.dict(), created_by=current_user["id"], date=datetime.now())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.get("/{expense_id}", response_model=ExpenseSchema)
def get_expense(expense_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get a specific expense"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Verify user has access to this expense's business
    from app.models.business import Business
    business = db.query(Business).filter(Business.id == expense.business_id, Business.user_id == current_user["id"]).first()
    if not business:
        raise HTTPException(status_code=404, detail="Access denied")

    return expense

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Delete an expense"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Verify user has access to this expense's business
    from app.models.business import Business
    business = db.query(Business).filter(Business.id == expense.business_id, Business.user_id == current_user["id"]).first()
    if not business:
        raise HTTPException(status_code=404, detail="Access denied")

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}
