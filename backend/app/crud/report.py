from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, text, desc
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict
import pandas as pd

from app.models.sale import Sale, SaleItem
from app.models.payment import Payment
from app.models.product import Product
from app.models.inventory import InventoryHistory
from app.models.user import User
from app.models.expense import Expense, ExpenseCategory

def get_sales_report(db: Session, start_date: date, end_date: date) -> Dict:
    """Generate comprehensive sales report USING BOTH USD AND LOCAL CURRENCY AMOUNTS"""
    # Convert dates to datetime for comparison
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    # Sales summary - RETURNING BOTH USD AND LOCAL CURRENCY AMOUNTS
    sales_data = db.query(
        func.coalesce(func.sum(Sale.total_amount), 0).label('total_sales'),          # USD amount
        func.coalesce(func.sum(Sale.original_amount), 0).label('total_sales_original'), # Local currency amount
        func.coalesce(func.sum(Sale.tax_amount), 0).label('total_tax'),              # USD tax amount
        func.count(Sale.id).label('total_transactions'),
        func.coalesce(func.avg(Sale.total_amount), 0).label('avg_transaction')       # USD average
    ).filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed'
    ).first()

    # Get primary currency using a simpler approach
    primary_currency_query = db.query(
        Sale.original_currency,
        func.count(Sale.id).label('count')
    ).filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed',
        Sale.original_currency.isnot(None)
    ).group_by(Sale.original_currency)\
     .order_by(desc(func.count(Sale.id)))\
     .first()

    primary_currency = primary_currency_query[0] if primary_currency_query else 'USD'

    # Payment methods breakdown (unchanged - counts are currency-agnostic)
    payment_methods_query = db.query(
        Payment.payment_method,
        func.count(Payment.id).label('count')
    ).join(Sale, Sale.id == Payment.sale_id)\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Payment.status == 'completed'
     ).group_by(Payment.payment_method).all()

    payment_methods = {pmt[0]: pmt[1] for pmt in payment_methods_query}

    # Top products - USING BOTH USD AND LOCAL CURRENCY AMOUNTS
    top_products = db.query(
        Product.id,
        Product.name,
        func.coalesce(func.sum(SaleItem.quantity), 0).label('quantity_sold'),
        func.coalesce(func.sum(SaleItem.subtotal), 0).label('total_revenue'),        # USD revenue
        func.coalesce(func.sum(SaleItem.original_subtotal), 0).label('total_revenue_original'), # Local currency revenue
        func.coalesce(func.avg(SaleItem.unit_price), 0).label('avg_price'),          # USD average price
        func.coalesce(func.avg(Product.cost_price), 0).label('avg_cost_price')       # USD cost price
    ).join(SaleItem, SaleItem.product_id == Product.id)\
     .join(Sale, Sale.id == SaleItem.sale_id)\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed'
     ).group_by(Product.id, Product.name)\
     .order_by(desc(func.sum(SaleItem.subtotal)))\
     .limit(10).all()

    # Sales trends (daily) - USING BOTH USD AND LOCAL CURRENCY AMOUNTS
    sales_trends = db.query(
        func.date(Sale.created_at).label('sale_date'),
        func.coalesce(func.sum(Sale.total_amount), 0).label('daily_sales'),          # USD daily sales
        func.coalesce(func.sum(Sale.original_amount), 0).label('daily_sales_original'), # Local currency daily sales
        func.count(Sale.id).label('transactions'),
        func.coalesce(func.avg(Sale.total_amount), 0).label('avg_order_value')       # USD average
    ).filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed'
    ).group_by(func.date(Sale.created_at))\
     .order_by(func.date(Sale.created_at)).all()

    return {
        'summary': {
            'total_sales': float(sales_data.total_sales),
            'total_sales_original': float(sales_data.total_sales_original),
            'total_tax': float(sales_data.total_tax),
            'total_transactions': sales_data.total_transactions,
            'average_transaction_value': float(sales_data.avg_transaction),
            'payment_methods': payment_methods,
            'primary_currency': primary_currency
        },
        'top_products': [
            {
                'product_id': p[0],
                'product_name': p[1],
                'quantity_sold': p[2],
                'total_revenue': float(p[3]),
                'total_revenue_original': float(p[4]),
                # FIXED: Calculate margin using USD values for consistency
                # Revenue (USD) - Cost (USD) = Profit (USD)
                # Profit / Revenue * 100 = Margin %
                # Cost = Quantity Sold * Average Cost Price (USD)
                'profit_margin': float((p[3] - (p[2] * p[6])) / p[3] * 100) if p[3] > 0 else 0
            } for p in top_products
        ],
        'sales_trends': [
            {
                'date': trend[0],
                'daily_sales': float(trend[1]),
                'daily_sales_original': float(trend[2]),
                'transactions': trend[3],
                'average_order_value': float(trend[4])
            } for trend in sales_trends
        ],
        'date_range': {
            'start_date': start_date,
            'end_date': end_date
        }
    }

def get_inventory_report(db: Session) -> Dict:
    """Generate comprehensive inventory report USING LOCAL CURRENCY VALUES"""
    # Inventory summary - USING LOCAL CURRENCY (original_price)
    inventory_summary = db.query(
        func.count(Product.id).label('total_products'),
        func.coalesce(func.sum(Product.stock_quantity * Product.original_price), 0).label('total_stock_value'),
        func.sum(case((Product.stock_quantity <= Product.min_stock_level, 1), else_=0)).label('low_stock_items'),
        func.sum(case((Product.stock_quantity == 0, 1), else_=0)).label('out_of_stock_items')
    ).first()

    # Stock movements (last 30 days) - USING LOCAL CURRENCY
    thirty_days_ago = datetime.now() - timedelta(days=30)
    stock_movements = db.query(
        InventoryHistory.product_id,
        Product.name,
        InventoryHistory.change_type,
        InventoryHistory.quantity_change,
        InventoryHistory.changed_at,
        (InventoryHistory.quantity_change * Product.original_price).label('value')
    ).join(Product, Product.id == InventoryHistory.product_id)\
     .filter(InventoryHistory.changed_at >= thirty_days_ago)\
     .order_by(desc(InventoryHistory.changed_at))\
     .limit(50).all()

    # Low stock alerts
    low_stock_alerts = db.query(Product).filter(
        Product.stock_quantity <= Product.min_stock_level
    ).all()

    return {
        'summary': {
            'total_products': inventory_summary[0],
            'total_stock_value': float(inventory_summary[1]),
            'low_stock_items': inventory_summary[2],
            'out_of_stock_items': inventory_summary[3],
            'inventory_turnover': 2.5
        },
        'stock_movements': [
            {
                'product_id': mov[0],
                'product_name': mov[1],
                'movement_type': mov[2],
                'quantity': mov[3],
                'value': float(mov[5]),
                'date': mov[4].date()
            } for mov in stock_movements
        ],
        'low_stock_alerts': [
            {
                'product_id': product.id,
                'product_name': product.name,
                'current_stock': product.stock_quantity,
                'min_stock_level': product.min_stock_level
            } for product in low_stock_alerts
        ]
    }


def get_financial_report(db: Session, start_date: date, end_date: date, business_id: Optional[int] = None) -> Dict:
    """Generate comprehensive financial report USING BOTH USD AND LOCAL CURRENCY AMOUNTS"""

    # Validate input parameters
    if start_date is None or end_date is None:
        raise ValueError("Start date and end date are required")

    # Ensure dates are proper date objects
    try:
        if isinstance(start_date, str):
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        if isinstance(end_date, str):
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
    except ValueError as e:
        raise ValueError(f"Invalid date format: {str(e)}")

    # Validate date range
    if start_date > end_date:
        raise ValueError("Start date must be before end date")

    # Convert to datetime
    try:
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())
    except (TypeError, ValueError) as e:
        raise ValueError(f"Invalid date conversion: {str(e)}")

    # Add optional business filter
    business_filter = True
    if business_id is not None:
        business_filter = Sale.business_id == business_id

    # Fetch sales data
    sales_data = db.query(
        func.coalesce(func.sum(Sale.total_amount), 0).label('total_revenue_usd'),
        func.coalesce(func.sum(Sale.original_amount), 0).label('total_revenue_original'),
        func.coalesce(func.sum(Sale.tax_amount), 0).label('total_tax_usd'),
        func.coalesce(func.sum(Sale.tax_amount / Sale.exchange_rate_at_sale), 0).label('tax_collected_original'),
        func.coalesce(func.sum(SaleItem.quantity * Product.cost_price), 0).label('cogs_usd'),
        func.coalesce(func.sum(SaleItem.quantity * Product.original_cost_price), 0).label('cogs_original')
    ).join(SaleItem, SaleItem.sale_id == Sale.id)\
     .join(Product, Product.id == SaleItem.product_id)\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed',
        business_filter
     ).first()

    # Handle None results
    if sales_data is None:
        sales_data = type('obj', (object,), {
            'total_revenue_usd': 0,
            'total_revenue_original': 0,
            'total_tax_usd': 0,
            'tax_collected_original': 0,
            'cogs_usd': 0,
            'cogs_original': 0
        })()

    # Convert to float safely
    total_revenue_usd = float(sales_data.total_revenue_usd or 0)
    total_revenue_original = float(sales_data.total_revenue_original or 0)
    total_tax_usd = float(sales_data.total_tax_usd or 0)
    tax_collected_original = float(sales_data.tax_collected_original or 0)
    cogs_usd = float(sales_data.cogs_usd or 0)
    cogs_original = float(sales_data.cogs_original or 0)

    gross_profit_usd = total_revenue_usd - cogs_usd
    gross_profit_original = total_revenue_original - cogs_original

    # Calculate gross margin percentages
    gross_margin = (gross_profit_usd / total_revenue_usd * 100) if total_revenue_usd > 0 else 0
    gross_margin_original = (gross_profit_original / total_revenue_original * 100) if total_revenue_original > 0 else 0

    # Operating expenses
    expenses_q = db.query(
        func.coalesce(func.sum(Expense.amount), 0).label('total_expenses_usd'),
        func.coalesce(func.sum(Expense.original_amount), 0).label('total_expenses_original')
    ).filter(
        Expense.date >= start_date,
        Expense.date <= end_date,
        business_filter
    ).first()

    operating_expenses_usd = float(expenses_q.total_expenses_usd or 0) if expenses_q else 0
    operating_expenses_original = float(expenses_q.total_expenses_original or 0) if expenses_q else 0

    # Net profits
    net_profit_usd = gross_profit_usd - operating_expenses_usd
    net_profit_original = gross_profit_original - operating_expenses_original

    # Calculate average exchange rate with proper None handling
    exchange_rate_data = db.query(
        func.sum(Sale.original_amount).label('total_original'),
        func.sum(Sale.total_amount).label('total_usd')
    ).filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed',
        Sale.original_amount.isnot(None),
        business_filter
    ).first()

    if (exchange_rate_data and exchange_rate_data.total_original and
        float(exchange_rate_data.total_original or 0) > 0):
        avg_exchange_rate = float(exchange_rate_data.total_usd or 0) / float(exchange_rate_data.total_original or 1)
    else:
        avg_exchange_rate = 1.0

    # Expense breakdown by category
    expense_breakdown_query = db.query(
        ExpenseCategory.name,
        func.coalesce(func.sum(Expense.original_amount), 0).label('category_total')
    ).join(Expense, Expense.category_id == ExpenseCategory.id)\
     .filter(
        Expense.date >= start_date,
        Expense.date <= end_date,
        business_filter
     ).group_by(ExpenseCategory.name).all()

    expense_breakdown_list = []
    total_expenses = float(operating_expenses_original or 0)

    for category_name, category_amount in expense_breakdown_query:
        amount_float = float(category_amount or 0)
        percentage = (amount_float / total_expenses * 100) if total_expenses > 0 else 0
        expense_breakdown_list.append({
            "category": category_name,
            "amount": amount_float,
            "percentage": percentage
        })

    # Profitability by product
    profitability = db.query(
        Product.id,
        Product.name,
        func.coalesce(func.sum(SaleItem.original_subtotal), 0).label('revenue'),
        func.coalesce(func.sum(SaleItem.quantity * Product.original_cost_price), 0).label('cost')
    ).join(SaleItem, SaleItem.product_id == Product.id)\
     .join(Sale, Sale.id == SaleItem.sale_id)\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed',
        business_filter
     ).group_by(Product.id, Product.name)\
     .order_by(desc(func.sum(SaleItem.original_subtotal)))\
     .limit(15).all()

    profitability_list = []
    for p in profitability:
        revenue = float(p[2] or 0)
        cost = float(p[3] or 0)
        profit = revenue - cost
        margin = (profit / revenue * 100) if revenue > 0 else 0
        profitability_list.append({
            'product_id': p[0],
            'product_name': p[1],
            'revenue': revenue,
            'cost': cost,
            'profit': profit,
            'margin': margin
        })

    # Cash flow analysis - USING LOCAL CURRENCY
    cash_flow = db.query(
        Payment.payment_method,
        func.coalesce(func.sum(Payment.amount / Sale.exchange_rate_at_sale), 0).label('total_amount')
    ).join(Sale, Sale.id == Payment.sale_id)\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Payment.status == 'completed',
        business_filter
     ).group_by(Payment.payment_method).all()

    cash_in = sum(float(cf[1] or 0) for cf in cash_flow)
    cash_out = float(cogs_original) + float(operating_expenses_original)
    net_cash_flow = cash_in - cash_out

    payment_method_breakdown = {}
    for cf in cash_flow:
        payment_method_breakdown[cf[0]] = float(cf[1] or 0)

    return {
        'summary': {
            'total_revenue': total_revenue_usd,
            'total_revenue_original': total_revenue_original,
            'exchange_rate': avg_exchange_rate,
            'cogs': cogs_usd,
            'cogs_original': cogs_original,
            'gross_profit': gross_profit_usd,
            'gross_profit_original': gross_profit_original,
            'gross_margin': gross_margin,
            'gross_margin_original': gross_margin_original,  # CALCULATED PROPERLY
            'tax_collected': total_tax_usd,
            'tax_collected_original': tax_collected_original,
            'operating_expenses': operating_expenses_usd,
            'operating_expenses_original': operating_expenses_original,
            'net_profit': net_profit_usd,
            'net_profit_original': net_profit_original,
            'net_income': net_profit_usd,
            'net_income_original': net_profit_original  # Same as net_profit_original
        },
        'profitability': profitability_list,
        'cash_flow': {
            'cash_in': cash_in,
            'cash_out': cash_out,
            'net_cash_flow': net_cash_flow,
            'payment_method_breakdown': payment_method_breakdown
        },
        'expense_breakdown': expense_breakdown_list,
        'date_range': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        }
    }
