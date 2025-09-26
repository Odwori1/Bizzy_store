from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Sale Item Schemas
class SaleItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    product_name: Optional[str] = None

class SaleItemCreate(SaleItemBase):
    pass

class SaleItem(SaleItemBase):
    id: int
    subtotal: float
    sale_id: int
    refunded_quantity: int = 0  # Add this field to the response schema

    # Add historical context fields (MUST match the model)
    original_unit_price: Optional[float] = None
    original_subtotal: Optional[float] = None
    exchange_rate_at_creation: Optional[float] = None

    product_name: Optional[str] = None
    class Config:
        from_attributes = True

# Payment Schemas
class PaymentBase(BaseModel):
    amount: float = Field(..., gt=0)
    payment_method: str = Field(..., pattern="^(cash|card|mobile_money)$")
    transaction_id: Optional[str] = None

    # --- ADD THESE THREE LINES ---
    original_amount: Optional[float] = None  # Local currency amount
    original_currency_code: Optional[str] = None  # Currency code
    exchange_rate_at_payment: Optional[float] = None # Conversion rate
    # -----------------------------

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
    # 🎯 ADD VIRTUAL BUSINESS NUMBERING
    business_sale_number: Optional[int] = None  # Per-business sequence number
    
    total_amount: float              # USD amount
    tax_amount: float                # USD tax amount
    usd_amount: float                # USD amount (duplicate for consistency)
    usd_tax_amount: float            # USD tax amount
    original_amount: Optional[float] = None   # Local amount
    original_currency: Optional[str] = None   # Currency code
    exchange_rate_at_sale: Optional[float] = None # Conversion rate
    payment_status: str
    created_at: datetime
    sale_items: List[SaleItem]
    payments: List[Payment]

    class Config:
        from_attributes = True

# Response Schemas
class SaleSummary(BaseModel):
    id: int
    # 🎯 ADD VIRTUAL BUSINESS NUMBERING
    business_sale_number: Optional[int] = None  # Per-business sequence number
    
    total_amount: float
    tax_amount: float
    payment_status: str
    created_at: datetime
    user_name: Optional[str] = None  # Make this optional
    original_amount: Optional[float] = None
    original_currency: Optional[str] = None
    exchange_rate_at_sale: Optional[float] = None

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
