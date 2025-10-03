from sqlalchemy import Column, Integer, String
from .base import Base

class BusinessSequence(Base):
    __tablename__ = "business_sequences"

    business_id = Column(Integer, primary_key=True)
    entity_type = Column(String(50), primary_key=True)  # 'sale', 'product', 'expense', 'inventory'
    last_number = Column(Integer, default=0)

    def __repr__(self):
        return f"<BusinessSequence business:{self.business_id} entity:{self.entity_type} last:{self.last_number}>"
