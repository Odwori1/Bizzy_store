from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    contact_person = Column(String(100))
    email = Column(String(100))
    phone = Column(String(20))
    address = Column(Text)
    tax_id = Column(String(50))
    payment_terms = Column(String(50))
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)  # 🚨 ADD THIS
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
    business = relationship("Business")  # 🚨 ADD THIS

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)  # 🚨 ADD THIS
    po_number = Column(String(50), unique=True, index=True)
    status = Column(String(20), default="draft")  # draft, ordered, received, cancelled
    total_amount = Column(Float, default=0.0)
    order_date = Column(DateTime, default=func.now())
    expected_delivery = Column(DateTime)
    received_date = Column(DateTime)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    supplier = relationship("Supplier", back_populates="purchase_orders")
    business = relationship("Business")  # 🚨 ADD THIS
    creator = relationship("User")
    po_items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    unit_cost = Column(Float)
    received_quantity = Column(Integer, default=0)
    notes = Column(Text)

    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="po_items")
    product = relationship("Product")
