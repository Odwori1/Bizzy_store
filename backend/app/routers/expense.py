from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.core.auth import get_current_user
from app.crud.expense import create_expense, get_business_expenses, delete_expense
from app.schemas.expense_schema import Expense, ExpenseCreate, ExpenseCategory, ExpenseCategoryCreate
from app.services.currency_service import CurrencyService  # IMPORT THE CURRENCY SERVICE

router = APIRouter(
    prefix="/api/expenses",
    tags=["expenses"]
)

@router.post("/", response_model=Expense)
async def create_new_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new expense - expects original_amount and original_currency_code"""
    try:
        currency_service = CurrencyService(db)
        
        # 1. Convert the user's local currency amount to USD
        usd_amount = await currency_service.convert_amount(
            expense.original_amount, 
            expense.original_currency_code, 
            'USD'
        )
        
        # 2. Get the exchange rate that was used for audit purposes
        exchange_rate = await currency_service.get_latest_exchange_rate(expense.original_currency_code, 'USD')
        
        # 3. Call the CRUD function, passing all the necessary data
        return create_expense(
            db, 
            expense, 
            current_user["id"],
            usd_amount,          # The calculated USD amount
            exchange_rate        # The rate used for the calculation
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create expense: {str(e)}")

@router.get("/", response_model=List[Expense])
async def get_expenses(
    business_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get expenses for a business"""
    return get_business_expenses(db, business_id, start_date, end_date)

@router.delete("/{expense_id}")
async def delete_expense_by_id(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete an expense"""
    expense = delete_expense(db, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}

# ===== EXPENSE CATEGORY ENDPOINTS =====
from app.crud.expense import get_expense_categories, create_expense_category, get_expense_category, update_expense_category, delete_expense_category

@router.get("/categories", response_model=List[ExpenseCategory])
async def get_all_expense_categories(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all active expense categories"""
    return get_expense_categories(db)

@router.get("/categories/{category_id}", response_model=ExpenseCategory)
async def get_single_expense_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific expense category by ID"""
    category = get_expense_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Expense category not found")
    return category

@router.post("/categories", response_model=ExpenseCategory)
async def create_new_expense_category(
    category: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new expense category"""
    return create_expense_category(db, category)

@router.put("/categories/{category_id}", response_model=ExpenseCategory)
async def update_existing_expense_category(
    category_id: int,
    category: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an existing expense category"""
    updated_category = update_expense_category(db, category_id, category)
    if not updated_category:
        raise HTTPException(status_code=404, detail="Expense category not found")
    return updated_category

@router.delete("/categories/{category_id}")
async def delete_existing_expense_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete (soft delete) an expense category"""
    success = delete_expense_category(db, category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense category not found")
    return {"message": "Expense category deleted successfully"}
