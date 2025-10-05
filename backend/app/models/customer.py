from sqlalchemy import Column, Integer, String, Float, DateTime, func
from sqlalchemy.orm import relationship
from .base import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey  # ADD ForeignKey here

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(200), nullable=True)
    loyalty_points = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    created_at = Column(DateTime, default=func.now())
    last_purchase = Column(DateTime, nullable=True)
    # Add this line in the Customer class definition
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)

    # Relationships
    sales = relationship("Sale", back_populates="customer")
