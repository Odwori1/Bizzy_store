from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from .base import Base

class Product(Base):
    __tablename__ = "products"  # Must match exactly

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    description = Column(String(300), nullable=True)
    price = Column(Float)
    barcode = Column(String(50), unique=True)
    stock_quantity = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=5)  # New: Minimum stock before alert
    last_restocked = Column(DateTime, default=func.now())  # New: Last restock date
    created_at = Column(DateTime, default=func.now())  # New: Creation timestamp
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())  # New: Update timest
