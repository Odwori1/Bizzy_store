from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ExpenseBase(BaseModel):
    # THESE ARE THE USER INPUTS (in their local currency)
    original_amount: float = Field(..., gt=0, description="Amount in the user's chosen currency")
    original_currency_code: str = Field(..., min_length=3, max_length=3, description="Currency code of the original_amount (e.g., UGX, USD, KES)")
    description: str = Field(..., max_length=255)
    category_id: int
    payment_method: str = Field("cash", max_length=50)
    is_recurring: bool = Field(False)
    recurrence_interval: Optional[str] = Field(None, max_length=50)
    receipt_url: Optional[str] = Field(None, max_length=500)

class ExpenseCreate(ExpenseBase):
    business_id: int

class ExpenseCategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=255)

class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass

class ExpenseCategory(ExpenseCategoryBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class Expense(ExpenseBase):
    id: int
    date: datetime
    created_by: int
    business_id: int
    # These are calculated by the backend upon creation
    amount: float = Field(..., description="The calculated USD equivalent of the original_amount")
    exchange_rate: Optional[float] = Field(None, description="The rate used for the conversion")
    # Add nested category information for frontend display
    category: Optional[ExpenseCategory] = Field(None, description="Category details")

    class Config:
        from_attributes = True
