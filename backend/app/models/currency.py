from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class Currency(Base):
    __tablename__ = "currencies"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(3), unique=True, nullable=False)  # ISO 4217 code: USD, UGX, EUR
    name = Column(String(100), nullable=False)
    symbol = Column(String(10), nullable=False)
    decimal_places = Column(Integer, default=2)
    symbol_position = Column(String(20), default="before")  # before, after, space_before, space_after
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    exchange_rates = relationship("ExchangeRate", foreign_keys="ExchangeRate.base_currency", back_populates="base_currency_rel")
    target_rates = relationship("ExchangeRate", foreign_keys="ExchangeRate.target_currency", back_populates="target_currency_rel")
    
    def __repr__(self):
        return f"<Currency {self.code}>"

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    
    id = Column(Integer, primary_key=True, index=True)
    base_currency = Column(String(3), ForeignKey('currencies.code'), nullable=False)
    target_currency = Column(String(3), ForeignKey('currencies.code'), nullable=False)
    rate = Column(Numeric(12, 6), nullable=False)  # 1 USD = 3712.50 UGX
    effective_date = Column(DateTime, default=func.now(), nullable=False)
    source = Column(String(50), default="openexchangerates")  # openexchangerates, central_bank, manual
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    base_currency_rel = relationship("Currency", foreign_keys=[base_currency], back_populates="exchange_rates")
    target_currency_rel = relationship("Currency", foreign_keys=[target_currency], back_populates="target_rates")
    
    def __repr__(self):
        return f"<ExchangeRate {self.base_currency}/{self.target_currency}: {self.rate}>"

# Update Business model to use currency code instead of separate fields
# File: /app/models/business.py - REMOVE the individual currency fields and add:
currency_code = Column(String(3), ForeignKey('currencies.code'), default='USD')
