from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class BarcodeScanEvent(Base):
    __tablename__ = "barcode_scan_events"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String(50), index=True)
    success = Column(Boolean, default=False)
    source = Column(String(20))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships - string-based to avoid circular imports
    user = relationship("User", back_populates="scan_events")
