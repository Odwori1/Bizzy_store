# New file: app/models/business.py
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import Base

class Business(Base):
    __tablename__ = "businesses"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100))
    address = Column(String(200))
    phone = Column(String(20))
    email = Column(String(100))
    logo_url = Column(String(200))
    tax_id = Column(String(50))

    # UPDATED: Single currency reference instead of multiple fields
    currency_code = Column(String(3), ForeignKey('currencies.code'), default='USD')
    country = Column(String(100), default="United States")
    country_code = Column(String(2), default="US")
    
    # Relationship
    user = relationship("User", back_populates="business")
    currency = relationship("Currency")  # Relationship to Currency model
