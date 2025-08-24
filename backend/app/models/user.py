from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String(20), default="cashier")  # 'admin' or 'cashier'
    created_at = Column(DateTime, default=func.now())
    reset_token = Column(String(100), unique=True, index=True, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
     # --- ADD THESE NEW 2FA FIELDS ---
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(32), nullable=True)
    two_factor_backup_codes = Column(JSON, nullable=True)  # Store as JSON array
    # --- END OF 2FA FIELDS ---

    # Relationships
    sales = relationship("Sale", back_populates="user")
    business = relationship("Business", back_populates="user", uselist=False)
