from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BarcodeScanEventBase(BaseModel):
    barcode: str
    success: bool
    source: str  # 'local_database' or 'external_api'

class BarcodeScanEventCreate(BarcodeScanEventBase):
    session_id: Optional[str] = None

class BarcodeScanEvent(BarcodeScanEventBase):
    id: int
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
