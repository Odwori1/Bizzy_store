# New file: app/schemas/business_schema.py
from pydantic import BaseModel
from typing import Optional  # ADD THIS IMPORT

class BusinessBase(BaseModel):
    name: str
    address: Optional[str] = None  # MAKE OPTIONAL
    phone: Optional[str] = None    # MAKE OPTIONAL
    email: Optional[str] = None    # MAKE OPTIONAL
    logo_url: Optional[str] = None # MAKE OPTIONAL
    tax_id: Optional[str] = None   # MAKE OPTIONAL

class BusinessCreate(BusinessBase):
    pass

class Business(BusinessBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True
