from app.database import SessionLocal
from app.models.expense import Expense, ExpenseCategory
from app.models.user import User
from app.models.business import Business
from sqlalchemy import func
from datetime import datetime
import logging

# Enable SQL logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

db = SessionLocal()

# Test the exact query that's causing issues
query = db.query(
    ExpenseCategory.name,
    func.coalesce(func.sum(Expense.amount), 0).label('category_total_usd'),
    func.coalesce(func.sum(Expense.original_amount), 0).label('category_total_original'),
    func.coalesce(func.avg(Expense.exchange_rate), 1.0).label('avg_exchange_rate')
).join(Expense, Expense.category_id == ExpenseCategory.id)\
 .filter(
    Expense.date >= datetime(2025, 8, 21),
    Expense.date <= datetime(2025, 9, 20),
    Expense.business_id == 2
 ).group_by(ExpenseCategory.name)

print("Query SQL:")
print(str(query))

result = query.all()
print("Result:", result)

db.close()
