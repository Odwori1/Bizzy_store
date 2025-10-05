from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class ActivityBase(BaseModel):
    type: Literal['sale', 'inventory', 'expense', 'user', 'system']
    description: str
    timestamp: datetime

class Activity(ActivityBase):
    id: int
    amount: Optional[float] = None
    currency_code: Optional[str] = None
    exchange_rate: Optional[float] = None
    usd_amount: Optional[float] = None
    product_id: Optional[int] = None
    user_id: Optional[int] = None
    username: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ActivityResponse(BaseModel):
    activities: list[Activity]
