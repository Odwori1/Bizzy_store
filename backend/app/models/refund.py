from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    user_id = Column(Integer, ForeignKey("users.id"))  # The staff who processed the refund
    reason = Column(Text, nullable=True)  # Reason for the refund
    total_amount = Column(Float)  # Total amount refunded
    status = Column(String(20), default="processed")  # processed, failed, pending
    created_at = Column(DateTime, default=func.now())

    # Relationships
    sale = relationship("Sale", back_populates="refunds")
    user = relationship("User")
    refund_items = relationship("RefundItem", back_populates="refund", cascade="all, delete-orphan")

class RefundItem(Base):
    __tablename__ = "refund_items"

    id = Column(Integer, primary_key=True, index=True)
    refund_id = Column(Integer, ForeignKey("refunds.id"))
    sale_item_id = Column(Integer, ForeignKey("sale_items.id"))
    quantity = Column(Integer)  # Quantity being refunded for this specific item

    # Relationships
    refund = relationship("Refund", back_populates="refund_items")
    sale_item = relationship("SaleItem")
