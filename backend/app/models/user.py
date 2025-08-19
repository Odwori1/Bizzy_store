from sqlalchemy import Column, Integer, String, Boolean, DateTime
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

    # Relationships
    #sales = relationship("Sale", back_populates="user")
