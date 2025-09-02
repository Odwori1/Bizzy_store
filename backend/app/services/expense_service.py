from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.expense import Expense, ExpenseCategory
from app.services.currency_service import CurrencyService

class ExpenseService:
    def __init__(self, db: Session):
        self.db = db
        self.currency_service = CurrencyService(db)
    
    async def create_expense(self, expense_data, user_id: int):
        """Create a new expense with currency conversion if needed"""
        # Get user's business to determine base currency
        from app.models.business import Business
        business = self.db.query(Business).filter(Business.id == expense_data.business_id).first()
        
        if business and business.currency_code != expense_data.currency_code:
            # Convert to business base currency
            converted_amount = await self.currency_service.convert_amount(
                expense_data.amount, 
                expense_data.currency_code, 
                business.currency_code
            )
            # Store both original and converted amounts?
            # For now, we'll convert and store in base currency
            expense_data.amount = converted_amount
            expense_data.currency_code = business.currency_code
        
        expense = Expense(**expense_data.dict(), created_by=user_id)
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense
    
    def get_business_expenses(self, business_id: int, start_date: Optional[datetime] = None, 
                             end_date: Optional[datetime] = None):
        """Get expenses for a specific business with optional date filtering"""
        query = self.db.query(Expense).filter(Expense.business_id == business_id)
        
        if start_date:
            query = query.filter(Expense.date >= start_date)
        if end_date:
            query = query.filter(Expense.date <= end_date)
        
        return query.order_by(Expense.date.desc()).all()
    
    def get_expense_summary(self, business_id: int):
        """Get expense summary by category for a business"""
        from sqlalchemy import func
        
        result = (self.db.query(
            ExpenseCategory.name,
            func.sum(Expense.amount).label('total_amount')
        )
        .join(Expense.category)
        .filter(Expense.business_id == business_id)
        .group_by(ExpenseCategory.name)
        .all())
        
        return [{"category": name, "total_amount": float(total)} for name, total in result]
