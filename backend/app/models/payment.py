from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    amount = Column(Float)
    payment_method = Column(String(20))  # cash, card, mobile_money
    transaction_id = Column(String(100), nullable=True)
    status = Column(String(20), default="pending")  # pending, completed, failed
    created_at = Column(DateTime, default=func.now())

    # Relationships
    sale = relationship("Sale", back_populates="payments")
