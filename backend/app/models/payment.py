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

    # --- ADD THESE THREE LINES FOR HISTORICAL CONTEXT ---
    original_amount = Column(Float)  # Local currency amount (PRESERVED)
    original_currency_code = Column(String(3), default='USD')  # Currency code
    exchange_rate_at_payment = Column(Float, default=1.0)   # Rate used for conversion

    # Relationships
    sale = relationship("Sale", back_populates="payments")
