from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=300)
    price: float = Field(..., gt=0)
    cost_price: Optional[float] = Field(None, gt=0)  # NEW: Optional cost price
    barcode: str = Field(..., max_length=50)
    stock_quantity: int = Field(0, ge=0)
    min_stock_level: int = Field(5, ge=0)

    # NEW: Validator to ensure cost_price is less than price if provided
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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_restocked: Optional[datetime] = None

    class Config:
        from_attributes = True
