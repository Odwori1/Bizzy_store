from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class InventoryHistory(Base):
    __tablename__ = "inventory_history"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    change_type = Column(String(20))  # 'restock', 'sale', 'adjustment', 'damage'
    quantity_change = Column(Integer)  # Positive for restock, negative for sale
    previous_quantity = Column(Integer)
    new_quantity = Column(Integer)
    reason = Column(String(200), nullable=True)  # Optional reason for adjustment
    changed_by = Column(Integer, ForeignKey("users.id"))  # User who made the change
    changed_at = Column(DateTime, default=func.now())
    
    # Relationships
    product = relationship("Product", backref="inventory_history")
    user = relationship("User")
