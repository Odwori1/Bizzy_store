from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Schemas for Refund Items
class RefundItemBase(BaseModel):
    sale_item_id: int
    quantity: int = Field(..., gt=0, description="Quantity to refund for this item")

class RefundItemCreate(RefundItemBase):
    pass

class RefundItem(RefundItemBase):
    id: int
    refund_id: int

    class Config:
        from_attributes = True

# Schemas for the main Refund
class RefundBase(BaseModel):
    reason: Optional[str] = None

class RefundCreate(RefundBase):
    sale_id: int
    refund_items: List[RefundItemCreate]

class Refund(RefundBase):
    id: int
    sale_id: int
    business_sale_number: int  # 🆕 ADD THIS FIELD - for display purposes
    user_id: int
    business_id: int
    business_refund_number: int
    total_amount: float  # USD amount
    # NEW: Currency context fields for historical preservation
    original_amount: float  # Local currency amount (PRESERVED)
    original_currency: str  # Currency code at transaction time
    exchange_rate_at_refund: float  # Rate used for conversion
    status: str
    created_at: datetime
    refund_items: List[RefundItem]

    class Config:
        from_attributes = True

# Schema for a Sale response that includes refund info
class SaleWithRefunds(BaseModel):
    id: int
    total_amount: float
    tax_amount: float
    payment_status: str
    created_at: datetime
    refunds: List[Refund] = []  # List of refunds associated with this sale

    class Config:
        from_attributes = True
