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
    user_id: int
    total_amount: float
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
