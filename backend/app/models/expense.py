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

    def __repr__(self):
        return f"<ExpenseCategory {self.name}>"

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    # The calculated USD amount for internal reporting
    amount = Column(Numeric(10, 2), nullable=False)
    # The original user input to preserve intent and value
    original_amount = Column(Numeric(10, 2), nullable=False)
    original_currency_code = Column(String(3), nullable=False)
    # The rate used for the conversion (for auditing)
    exchange_rate = Column(Numeric(10, 6))

    description = Column(String(255))
    category_id = Column(Integer, ForeignKey('expense_categories.id'), nullable=False)
    date = Column(DateTime, default=func.now(), nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    business_id = Column(Integer, ForeignKey('businesses.id'), nullable=False)
    payment_method = Column(String(50), default='cash')
    receipt_url = Column(String(500))
    is_recurring = Column(Boolean, default=False)
    recurrence_interval = Column(String(50))

    # Relationships
    category = relationship("ExpenseCategory")
    user = relationship("User", backref="expenses", lazy="select")
    business = relationship("Business", lazy="select")

    def __repr__(self):
        return f"<Expense {self.description}: {self.original_amount} {self.original_currency_code} >"

    # Add business-scoped numbering
    business_expense_number = Column(Integer)  # Business-scoped expense number
