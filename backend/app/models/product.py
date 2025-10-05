from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey  # ADD ForeignKey here

class Product(Base):
    __tablename__ = "products"  # Must match exactly

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    description = Column(String(300), nullable=True)
    price = Column(Float) # Price in USD (existing field)
    cost_price = Column(Float, nullable=True)  # Cost price in USD for profit calculation
    barcode = Column(String(50), unique=True)
    stock_quantity = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=5)  # Minimum stock before alert
    last_restocked = Column(DateTime, default=func.now())  # Last restock date
    created_at = Column(DateTime, default=func.now())  # Creation timestamp
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())  # Update timestamp

    # NEW: Local currency context fields (nullable for backward compatibility)
    original_price = Column(Float, nullable=True)  # Price in local currency at time of creation/update
    original_cost_price = Column(Float, nullable=True)  # NEW: Cost price in local currency at time of creation/update
    original_currency_code = Column(String(3), nullable=True)  # Currency code for original_price
    exchange_rate_at_creation = Column(Float, nullable=True)  # Rate used for conversion (Local -> USD)
    # Add this line in the Product class definition (around line 20-30)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)

    # Relationships
    sale_items = relationship("SaleItem", back_populates="product")

    # Add business-scoped numbering
    business_product_number = Column(Integer)  # Business-scoped product number
