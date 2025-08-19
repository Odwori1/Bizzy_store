from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=300)
    price: float = Field(..., gt=0)
    barcode: str = Field(..., max_length=50)
    stock_quantity: int = Field(0, ge=0)
    min_stock_level: int = Field(5, ge=0)  # New field

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: Optional[datetime] = None  # ← Changed to Optional
    updated_at: Optional[datetime] = None  # ← Changed to Optional
    last_restocked: Optional[datetime] = None  # New field

    class Config:
        from_attributes = True
