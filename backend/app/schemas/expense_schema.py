from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ExpenseCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass

class ExpenseCategory(ExpenseCategoryBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    amount: float
    currency_code: Optional[str] = "USD"  # NEW: currency field
    description: Optional[str] = None
    category_id: int
    business_id: int  # NEW: multi-business support
    payment_method: Optional[str] = "cash"
    is_recurring: Optional[bool] = False
    recurrence_interval: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    date: datetime
    created_by: int
    receipt_url: Optional[str] = None

    class Config:
        from_attributes = True

class ExpenseWithCategory(Expense):
    category: ExpenseCategory
