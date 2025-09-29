from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.models.sale import Sale
from app.models.inventory import InventoryHistory
from app.models.expense import Expense
import logging

logger = logging.getLogger(__name__)

class ActivityService:
    @staticmethod
    def get_recent_activities(db: Session, business_id: int, hours: int = 24, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent sales, inventory changes, and expenses for a specific business"""
        try:
            since = datetime.now() - timedelta(hours=hours)
            all_activities = []

            # Recent sales - FILTERED BY BUSINESS_ID
            try:
                recent_sales = db.query(Sale).filter(
                    Sale.business_id == business_id,  # 🚨 CRITICAL FIX: Add business filtering
                    Sale.created_at >= since,
                    Sale.payment_status == 'completed'
                ).order_by(Sale.created_at.desc()).limit(limit).all()

                for sale in recent_sales:
                    # Use original_amount and original_currency for display
                    amount_display = sale.original_amount if sale.original_amount is not None else sale.total_amount
                    currency_code = sale.original_currency if sale.original_currency else 'UGX'

                    # Calculate USD equivalent using exchange rate if available
                    usd_amount = sale.total_amount  # This is already in USD
                    exchange_rate = sale.exchange_rate_at_creation if hasattr(sale, 'exchange_rate_at_creation') else None

                    all_activities.append({
                        'type': 'sale',
                        'id': sale.id,
                        'description': 'Sale completed',
                        'amount': float(amount_display),
                        'currency_code': currency_code,
                        'exchange_rate': exchange_rate,
                        'usd_amount': float(usd_amount),
                        'timestamp': sale.created_at,
                        'user_id': sale.user_id
                    })
            except Exception as e:
                logger.error(f"Error fetching sales activities: {e}")

            # Inventory changes - FILTERED BY BUSINESS_ID
            try:
                inventory_changes = db.query(InventoryHistory).filter(
                    InventoryHistory.business_id == business_id,  # 🚨 CRITICAL FIX: Add business filtering
                    InventoryHistory.changed_at >= since
                ).order_by(InventoryHistory.changed_at.desc()).limit(limit).all()

                for change in inventory_changes:
                    all_activities.append({
                        'type': 'inventory',
                        'id': change.id,
                        'description': f'Stock {change.change_type}: {change.quantity_change} units',
                        'product_id': change.product_id,
                        'timestamp': change.changed_at,
                        'user_id': change.changed_by
                    })
            except Exception as e:
                logger.error(f"Error fetching inventory activities: {e}")

            # Recent expenses - FILTERED BY BUSINESS_ID
            try:
                recent_expenses = db.query(Expense).filter(
                    Expense.business_id == business_id,  # 🚨 CRITICAL FIX: Add business filtering
                    Expense.date >= since
                ).order_by(Expense.date.desc()).limit(limit).all()

                for expense in recent_expenses:
                    # Use currency_code from expense for display
                    currency_code = getattr(expense, 'currency_code', 'UGX')
                    amount_display = getattr(expense, 'original_amount', expense.amount)
                    exchange_rate = getattr(expense, 'exchange_rate', 1.0)
                    usd_amount = expense.amount  # This is already in USD

                    all_activities.append({
                        'type': 'expense',
                        'id': expense.id,
                        'description': f'Expense: {expense.description}',
                        'amount': float(amount_display),
                        'currency_code': currency_code,
                        'exchange_rate': exchange_rate,
                        'usd_amount': float(usd_amount),
                        'timestamp': expense.date,
                        'user_id': getattr(expense, 'created_by', None)
                    })
            except Exception as e:
                logger.error(f"Error fetching expense activities: {e}")

            # Sort by timestamp descending and return limited results
            all_activities.sort(key=lambda x: x['timestamp'], reverse=True)
            return all_activities[:limit]

        except Exception as e:
            logger.error(f"Error in get_recent_activities: {e}")
            return []
