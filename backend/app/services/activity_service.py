from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from app.models.sale import Sale
from app.models.inventory import InventoryHistory
from app.models.expense import Expense

class ActivityService:
    @staticmethod
    def get_recent_activities(db: Session, hours: int = 24, limit: int = 10):
        """Get recent sales, inventory changes, and expenses"""
        since = datetime.now() - timedelta(hours=hours)

        # Recent sales
        recent_sales = db.query(Sale).filter(
            Sale.created_at >= since,
            Sale.payment_status == 'completed'
        ).order_by(Sale.created_at.desc()).limit(limit).all()

        # Inventory changes
        inventory_changes = db.query(InventoryHistory).filter(
            InventoryHistory.changed_at >= since
        ).order_by(InventoryHistory.changed_at.desc()).limit(limit).all()

        # Recent expenses
        recent_expenses = db.query(Expense).filter(
            Expense.date >= since
        ).order_by(Expense.date.desc()).limit(limit).all()

        # Combine and sort all activities
        all_activities = []

        for sale in recent_sales:
            all_activities.append({
                'type': 'sale',
                'id': sale.id,
                'description': f'Sale completed: UGX {sale.total_amount:,.0f}',
                'amount': float(sale.total_amount),
                'timestamp': sale.created_at,
                # Use user_id instead of cashier_id or created_by
                'user_id': sale.user_id
            })

        for change in inventory_changes:
            all_activities.append({
                'type': 'inventory',
                'id': change.id,
                'description': f'Stock {change.change_type}: {change.quantity_change} units',
                'product_id': change.product_id,
                'timestamp': change.changed_at,
                'user_id': change.changed_by
            })

        for expense in recent_expenses:
            all_activities.append({
                'type': 'expense',
                'id': expense.id,
                'description': f'Expense: {expense.description} - UGX {expense.amount:,.0f}',
                'amount': float(expense.amount),
                'timestamp': expense.date,
                'user_id': expense.created_by
            })

        # Sort by timestamp descending and return limited results
        all_activities.sort(key=lambda x: x['timestamp'], reverse=True)
        return all_activities[:limit]
