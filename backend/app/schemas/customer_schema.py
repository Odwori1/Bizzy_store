from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=200)

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    loyalty_points: int
    total_spent: float
    created_at: datetime
    last_purchase: Optional[datetime]

    class Config:
        from_attributes = True

class CustomerPurchaseHistory(BaseModel):
    sale_id: int
    total_amount: float
    created_at: datetime
    items: List[str]  # Product names

    class Config:
        from_attributes = True
