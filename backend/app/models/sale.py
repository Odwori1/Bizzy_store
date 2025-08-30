from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)  # ADD THIS LINE
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    payment_status = Column(String(20), default="pending")  # pending, completed, refunded
    created_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("User", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")  # ADD THIS LINE
    sale_items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="sale", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="sale")  # Add refund relationship

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    unit_price = Column(Float)
    subtotal = Column(Float)
    refunded_quantity = Column(Integer, default=0)  # Tracks how many of this item were refunded

    # Relationships
    sale = relationship("Sale", back_populates="sale_items")
    product = relationship("Product", back_populates="sale_items")
