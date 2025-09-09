from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base
from .permission import user_role

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    reset_token = Column(String(100), unique=True, index=True, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=True)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(32), nullable=True)
    two_factor_backup_codes = Column(JSON, nullable=True)

    # Relationships
    sales = relationship("Sale", back_populates="user")
    business = relationship("Business", back_populates="users")
    roles = relationship("Role", secondary=user_role, back_populates="users")
    scan_events = relationship("BarcodeScanEvent", back_populates="user")  # String-based reference

    # NEW: Property to get role names for display
    @property
    def role_name(self):
        """Get a string representation of the user's roles."""
        if not self.roles:
            return None
        return ", ".join([role.name for role in self.roles])

    def __repr__(self):
        return f"<User {self.username}>"
