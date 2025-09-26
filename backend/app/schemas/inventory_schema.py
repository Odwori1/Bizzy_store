from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryAdjustment(BaseModel):
    product_id: int
    quantity_change: int
    reason: Optional[str] = None

class InventoryHistoryBase(BaseModel):
    change_type: str
    quantity_change: int
    previous_quantity: int
    new_quantity: int
    reason: Optional[str] = None
    changed_at: datetime

class InventoryHistory(InventoryHistoryBase):
    id: int
    product_id: int
    product_name: str
    changed_by: int
    business_inventory_number: Optional[int] = None                    # 🆕 ADD
    business_id: Optional[int] = None                                  # 🆕 ADD

    class Config:
        from_attributes = True

class LowStockAlert(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    min_stock_level: int

class StockLevel(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    min_stock_level: int
    last_restocked: Optional[datetime] = None
    needs_restock: bool
