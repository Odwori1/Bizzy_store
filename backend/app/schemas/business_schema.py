from pydantic import BaseModel
from typing import Optional

class BusinessBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    tax_id: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    
    # KEEP ONLY currency_code AS IT'S THE FOREIGN KEY TO THE currencies TABLE
    # REMOVE THE OLD CURRENCY FIELDS THAT ARE NO LONGER IN THE Business MODEL
    currency_code: Optional[str] = None

class BusinessCreate(BusinessBase):
    pass

class Business(BusinessBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
