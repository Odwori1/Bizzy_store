from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)  # <-- ADD THIS

    # USD amounts for consistent internal reporting (REPURPOSED FIELDS)
    total_amount = Column(Float, default=0.0)          # USD amount
    tax_amount = Column(Float, default=0.0)           # USD tax amount

    # Local currency context (EXISTING - from migration 9749a44864c1)
    original_amount = Column(Float, default=0.0)       # Local currency amount
    original_currency = Column(String(3), default='USD')  # Currency at time of sale
    exchange_rate_at_sale = Column(Float, default=1.0)   # Rate used for conversion

    # NEW: USD amounts for financial consistency (duplicates for clarity)
    usd_amount = Column(Float, default=0.0)            # USD equivalent
    usd_tax_amount = Column(Float, default=0.0)        # USD tax equivalent

    # Add business-scoped numbering - CORRECT PLACEMENT
    business_sale_number = Column(Integer)  # Business-scoped sale number

    payment_status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=func.now())

    # Relationships (unchanged)
    user = relationship("User", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
    business = relationship("Business", back_populates="sales")
    sale_items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="sale", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="sale")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    unit_price = Column(Float)  # USD unit price
    subtotal = Column(Float)    # USD subtotal
    refunded_quantity = Column(Integer, default=0)

    # NEW: Local currency context fields for sale_items (added by migration 9aa6020251dd)
    original_unit_price = Column(Float)  # Local currency unit price (PRESERVED)
    original_subtotal = Column(Float)    # Local currency subtotal (PRESERVED)

    exchange_rate_at_creation = Column(Float, default=1.0)   # Rate used for conversion

    # Relationships
    sale = relationship("Sale", back_populates="sale_items")
    product = relationship("Product", back_populates="sale_items")

    @property
    def product_name(self):
        return self.product.name if self.product else None
