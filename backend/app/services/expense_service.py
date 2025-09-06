from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.models.expense import Expense, ExpenseCategory
from app.services.currency_service import CurrencyService

class ExpenseService:
    def __init__(self, db: Session):
        self.db = db
        self.currency_service = CurrencyService(db)

    async def create_expense(self, expense_data, user_id: int):
        """Create a new expense with currency conversion to USD"""
        print(f"DEBUG: Creating expense with amount={expense_data.amount}, currency={expense_data.currency_code}")

        # Store the original values for auditing before we modify the data
        original_amount = expense_data.amount
        original_currency_code = expense_data.currency_code
        exchange_rate = None  # Track the exchange rate used

        # Convert ALL currencies to USD for consistent storage
        if original_currency_code != "USD":
            print(f"DEBUG: Converting {original_amount} {original_currency_code} to USD")
            try:
                # Get the current exchange rate first
                exchange_rate = await self.currency_service.get_exchange_rate(
                    original_currency_code,
                    "USD"
                )
                print(f"DEBUG: Current exchange rate: {exchange_rate}")
                
                # Convert using the live rate
                converted_amount = original_amount * exchange_rate
                print(f"DEBUG: Live conversion result: {converted_amount}")
                
                # Use the converted amount for storage
                expense_data.amount = converted_amount
            except Exception as e:
                print(f"DEBUG: Currency API failed: {e}")
                # Don't use fallback rates - fail the operation instead
                raise HTTPException(
                    status_code=400,
                    detail=f"Currency conversion failed: {str(e)}. Please try again."
                )

        print(f"DEBUG: Final amount to store: {expense_data.amount} USD")

        # Create the expense with the converted USD amount
        expense_data_dict = expense_data.dict()
        expense = Expense(
            amount=expense_data.amount,  # This is now in USD
            original_amount=original_amount,  # Preserve original input
            original_currency_code=original_currency_code,  # Preserve original currency
            exchange_rate=exchange_rate,  # Store the rate used for conversion
            description=expense_data_dict.get('description'),
            category_id=expense_data.category_id,
            business_id=expense_data.business_id,
            payment_method=expense_data_dict.get('payment_method', 'cash'),
            is_recurring=expense_data_dict.get('is_recurring', False),
            recurrence_interval=expense_data_dict.get('recurrence_interval'),
            created_by=user_id
        )

        # Handle optional fields that might not be in the create schema
        if hasattr(expense_data, 'receipt_url') and expense_data.receipt_url:
            expense.receipt_url = expense_data.receipt_url

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
