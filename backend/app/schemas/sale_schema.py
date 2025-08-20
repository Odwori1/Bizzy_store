from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Sale Item Schemas
class SaleItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)

class SaleItemCreate(SaleItemBase):
    pass

class SaleItem(SaleItemBase):
    id: int
    subtotal: float
    sale_id: int

    class Config:
        from_attributes = True

# Payment Schemas
class PaymentBase(BaseModel):
    amount: float = Field(..., gt=0)
    payment_method: str = Field(..., pattern="^(cash|card|mobile_money)$")
    transaction_id: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    sale_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Sale Schemas
class SaleBase(BaseModel):
    user_id: int

class SaleCreate(SaleBase):
    sale_items: List[SaleItemCreate]
    payments: List[PaymentCreate]
    tax_rate: float = Field(0.0, ge=0, le=100)

class Sale(SaleBase):
    id: int
    total_amount: float
    tax_amount: float
    payment_status: str
    created_at: datetime
    sale_items: List[SaleItem]
    payments: List[Payment]

    class Config:
        from_attributes = True

# Response Schemas
class SaleSummary(BaseModel):
    id: int
    total_amount: float
    tax_amount: float
    payment_status: str
    created_at: datetime
    user_name: str

    class Config:
        from_attributes = True

class DailySalesReport(BaseModel):
    date: str
    total_sales: float
    total_tax: float
    total_transactions: int
    payment_methods: dict

    class Config:
        from_attributes = True
