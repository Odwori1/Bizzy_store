from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255))
    is_active = Column(Boolean, default=True)

    # Relationship to expenses
    expenses = relationship("Expense", back_populates="category")

    def __repr__(self):
        return f"<ExpenseCategory {self.name}>"

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency_code = Column(String(3), ForeignKey('currencies.code'), default='USD')  # NEW: currency support
    description = Column(String(255))
    category_id = Column(Integer, ForeignKey('expense_categories.id'), nullable=False)
    date = Column(DateTime, default=func.now(), nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    business_id = Column(Integer, ForeignKey('businesses.id'), nullable=False)  # NEW: for multi-business support
    payment_method = Column(String(50), default='cash')
    receipt_url = Column(String(500))
    is_recurring = Column(Boolean, default=False)
    recurrence_interval = Column(String(50))

    # Relationships
    category = relationship("ExpenseCategory", back_populates="expenses")
    user = relationship("User", backref="expenses")
    currency = relationship("Currency")  # NEW: relationship to Currency model
    business = relationship("Business")  # NEW: relationship to Business model

    def __repr__(self):
        return f"<Expense {self.description}: {self.amount}>"
