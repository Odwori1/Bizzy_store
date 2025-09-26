from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=300)
    price: float = Field(..., gt=0)
    cost_price: Optional[float] = Field(None, gt=0)
    barcode: str = Field(..., max_length=50)
    stock_quantity: int = Field(0, ge=0)
    min_stock_level: int = Field(5, ge=0)

    @validator('cost_price')
    def validate_cost_price(cls, v, values):
        if v is not None and 'price' in values and v >= values['price']:
            raise ValueError('Cost price must be less than selling price')
        return v

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    # 🎯 ADD VIRTUAL BUSINESS NUMBERING
    business_product_number: Optional[int] = None  # Per-business sequence number
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_restocked: Optional[datetime] = None

    # NEW: Currency context fields for historical preservation
    original_price: Optional[float] = None
    original_cost_price: Optional[float] = None  # NEW: Preserved original cost price
    original_currency_code: Optional[str] = None
    exchange_rate_at_creation: Optional[float] = None

    class Config:
        from_attributes = True
