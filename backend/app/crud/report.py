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
from app.models.business import Business
from app.models.refund import Refund, RefundItem

def get_sales_report(db: Session, start_date: date, end_date: date, business_id: Optional[int] = None) -> Dict:
    """Generate comprehensive sales report USING BOTH USD AND LOCAL CURRENCY AMOUNTS"""
    # Convert dates to datetime for comparison
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    # Add business filter
    business_filter = True
    if business_id is not None:
        business_filter = Sale.business_id == business_id

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
        Sale.payment_status == 'completed',
        business_filter  # ← CRITICAL SECURITY FIX: ADD BUSINESS FILTER
    ).first()

    # Get primary currency using a simpler approach
    primary_currency_query = db.query(
        Sale.original_currency,
        func.count(Sale.id).label('count')
    ).filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed',
        Sale.original_currency.isnot(None),
        business_filter  # ← CRITICAL SECURITY FIX: ADD BUSINESS FILTER
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
        Payment.status == 'completed',
        business_filter  # ← CRITICAL SECURITY FIX: ADD BUSINESS FILTER
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
        Sale.payment_status == 'completed',
        business_filter  # ← CRITICAL SECURITY FIX: ADD BUSINESS FILTER
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
        Sale.payment_status == 'completed',
        business_filter  # ← CRITICAL SECURITY FIX: ADD BUSINESS FILTER
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

def get_inventory_report(db: Session, business_id: Optional[int] = None) -> Dict:
    """Generate comprehensive inventory report WITH DUAL CURRENCY SUPPORT"""
    # Add business filter
    business_filter = True
    if business_id is not None:
        business_filter = Product.business_id == business_id

    # Inventory summary - WITH DUAL CURRENCY
    inventory_summary = db.query(
        func.coalesce(func.count(Product.id), 0).label('total_products'),  # FIX: Add coalesce for null values
        func.coalesce(func.sum(Product.stock_quantity * Product.price), 0).label('total_stock_value_usd'),  # USD
        func.coalesce(func.sum(Product.stock_quantity * Product.original_price), 0).label('total_stock_value_original'),  # Local
        func.coalesce(func.sum(case((Product.stock_quantity <= Product.min_stock_level, 1), else_=0)), 0).label('low_stock_items'),  # FIX: Add coalesce
        func.coalesce(func.sum(case((Product.stock_quantity == 0, 1), else_=0)), 0).label('out_of_stock_items')  # FIX: Add coalesce
    ).filter(
        business_filter  # ← CRITICAL SECURITY FIX: ADD BUSINESS FILTER
    ).first()

    # Get primary business currency from the filtered products
    primary_currency_query = db.query(
        Product.original_currency_code,
        func.count(Product.id).label('count')
    ).filter(
        business_filter,  # ← CRITICAL SECURITY FIX: ADD BUSINESS FILTER
        Product.original_currency_code.isnot(None)
    ).group_by(Product.original_currency_code)\
     .order_by(desc(func.count(Product.id)))\
     .first()

    primary_currency = primary_currency_query[0] if primary_currency_query else 'USD'

    # Stock movements (last 30 days) - WITH DUAL CURRENCY
    thirty_days_ago = datetime.now() - timedelta(days=30)
    stock_movements = db.query(
        InventoryHistory.product_id,
        Product.name,
        InventoryHistory.change_type,
        InventoryHistory.quantity_change,
        InventoryHistory.changed_at,
        (InventoryHistory.quantity_change * Product.price).label('value_usd'),  # USD
        (InventoryHistory.quantity_change * Product.original_price).label('value_original'),  # Local
        Product.original_currency_code,
        Product.exchange_rate_at_creation
    ).join(Product, Product.id == InventoryHistory.product_id)\
     .filter(
        InventoryHistory.changed_at >= thirty_days_ago,
        business_filter  # ← CRITICAL SECURITY FIX: ADD BUSINESS FILTER
     ).order_by(desc(InventoryHistory.changed_at))\
     .limit(50).all()

    # Low stock alerts (unchanged) - WITH BUSINESS FILTER
    low_stock_alerts = db.query(Product).filter(
        Product.stock_quantity <= Product.min_stock_level,
        business_filter  # ← CRITICAL SECURITY FIX: ADD BUSINESS FILTER
    ).all()

    # Calculate actual inventory turnover or return 0 for no inventory
    if inventory_summary.total_products == 0 or inventory_summary.total_stock_value_usd == 0:
        inventory_turnover = 0.0
    else:
    # This would require actual COGS data from sales
    # For now, we could use a placeholder or implement proper calculation
        inventory_turnover = 0.0  # Temporary until proper calculation is implemented

    return {
        'summary': {
            'total_products': int(inventory_summary.total_products),  # FIX: Convert to int
            'total_stock_value': float(inventory_summary.total_stock_value_usd),  # USD
            'total_stock_value_original': float(inventory_summary.total_stock_value_original),  # Local
            'primary_currency': primary_currency,
            'low_stock_items': int(inventory_summary.low_stock_items),  # FIX: Convert to int
            'out_of_stock_items': int(inventory_summary.out_of_stock_items),  # FIX: Convert to int
            'inventory_turnover': inventory_turnover
        },
        'stock_movements': [
            {
                'product_id': mov[0],
                'product_name': mov[1],
                'movement_type': mov[2],
                'quantity': mov[3],
                'value': float(mov[5]),  # USD
                'value_original': float(mov[6]),  # Local
                'original_currency_code': mov[7],
                'exchange_rate_at_creation': mov[8],
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
    """Generate comprehensive financial report WITH REFUND SUPPORT"""

    # [KEEP ALL EXISTING VALIDATION AND SETUP CODE...]
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
        expense_business_filter = Expense.business_id == business_id
        refund_business_filter = Refund.business_id == business_id
    else:
        expense_business_filter = True
        refund_business_filter = True

    # [KEEP ALL EXISTING SALES CALCULATIONS...]
    # Fetch sales data
    sales_data = db.query(
        func.coalesce(func.sum(Sale.total_amount), 0).label('total_revenue_usd'),
        func.coalesce(func.sum(Sale.original_amount), 0).label('total_revenue_original'),
        func.coalesce(func.sum(Sale.tax_amount), 0).label('total_tax_usd'),
        func.coalesce(func.sum(Sale.tax_amount / Sale.exchange_rate_at_sale), 0).label('tax_collected_original'),
        func.coalesce(func.sum(SaleItem.quantity * Product.cost_price), 0).label('cogs_usd'),
        func.coalesce(func.sum(SaleItem.quantity * Product.original_cost_price), 0).label('cogs_original'),
        func.count(Sale.id).label('total_transactions')
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
            'cogs_original': 0,
            'total_transactions': 0
        })()

    # Convert to float safely
    total_revenue_usd = float(sales_data.total_revenue_usd or 0)
    total_revenue_original = float(sales_data.total_revenue_original or 0)
    total_tax_usd = float(sales_data.total_tax_usd or 0)
    tax_collected_original = float(sales_data.tax_collected_original or 0)
    cogs_usd = float(sales_data.cogs_usd or 0)
    cogs_original = float(sales_data.cogs_original or 0)
    total_transactions = int(sales_data.total_transactions) if sales_data and sales_data.total_transactions is not None else 0

    # Gross profit calculations
    gross_profit_usd = total_revenue_usd - cogs_usd
    gross_profit_original = total_revenue_original - cogs_original
    gross_margin = (gross_profit_usd / total_revenue_usd * 100) if total_revenue_usd > 0 else 0
    gross_margin_original = (gross_profit_original / total_revenue_original * 100) if total_revenue_original > 0 else 0

    # [KEEP ALL EXISTING EXPENSE CALCULATIONS...]
    # Operating expenses calculation
    expenses_q = db.query(
        func.coalesce(func.sum(Expense.amount), 0).label('total_expenses_usd'),
        func.coalesce(func.sum(Expense.original_amount), 0).label('total_expenses_original'),
    ).filter(
        Expense.date >= start_date,
        Expense.date <= end_date,
        expense_business_filter
    ).first()

    operating_expenses_usd = float(expenses_q.total_expenses_usd or 0) if expenses_q else 0
    operating_expenses_original = float(expenses_q.total_expenses_original or 0) if expenses_q else 0

    if expenses_q and expenses_q.total_expenses_original and float(expenses_q.total_expenses_original or 0) > 0:
        operating_expenses_exchange_rate = float(expenses_q.total_expenses_usd or 0) / float(expenses_q.total_expenses_original or 1)
    else:
        operating_expenses_exchange_rate = 1.0

    # Net profits
    net_profit_usd = gross_profit_usd - operating_expenses_usd
    net_profit_original = gross_profit_original - operating_expenses_original

    # 🆕 NEW: REFUND CALCULATIONS
    
    refunds_data = db.query(
        func.coalesce(func.sum(Refund.total_amount), 0).label('total_refunds_usd'),
        func.coalesce(func.sum(Refund.original_amount), 0).label('total_refunds_original'),
        func.count(Refund.id).label('refund_count')
    ).filter(
        Refund.created_at >= start_dt,
        Refund.created_at <= end_dt,
        Refund.status == 'processed',
        refund_business_filter
    ).first()

    total_refunds_usd = float(refunds_data.total_refunds_usd or 0) if refunds_data else 0
    total_refunds_original = float(refunds_data.total_refunds_original or 0) if refunds_data else 0
    refund_count = int(refunds_data.refund_count or 0) if refunds_data else 0

    # Calculate net revenue (sales minus refunds)
    net_revenue_usd = total_revenue_usd - total_refunds_usd
    net_revenue_original = total_revenue_original - total_refunds_original
    refund_rate = (refund_count / total_transactions * 100) if total_transactions > 0 else 0

    # 🆕 NEW: REFUND BREAKDOWN
    refunds_breakdown = db.query(Refund).filter(
        Refund.created_at >= start_dt,
        Refund.created_at <= end_dt,
        Refund.status == 'processed',
        refund_business_filter
    ).all()

    refund_details = []
    for refund in refunds_breakdown:
        # Get sale business number for display
        sale_business_number = None
        if refund.sale and hasattr(refund.sale, 'business_sale_number'):
            sale_business_number = refund.sale.business_sale_number

        refund_detail = {
            "refund_id": refund.id,
            "business_refund_number": refund.business_refund_number,
            "sale_id": refund.sale_id,
            "sale_business_number": sale_business_number,
            "amount": refund.total_amount,
            "original_amount": refund.original_amount,
            "original_currency": refund.original_currency,
            "reason": refund.reason or "No reason provided",
            "date": refund.created_at,
            "items": [{
                "product_name": item.sale_item.product.name if item.sale_item and item.sale_item.product else "Unknown Product",
                "quantity": item.quantity,
                "amount": item.refund_amount if hasattr(item, 'refund_amount') else 0
            } for item in refund.refund_items]
        }
        refund_details.append(refund_detail)

    # [KEEP ALL EXISTING PROFITABILITY CALCULATIONS...]
    # Profitability by product
    profitability = db.query(
        Product.id,
        Product.name,
        func.coalesce(func.sum(SaleItem.subtotal), 0).label('revenue_usd'),
        func.coalesce(func.sum(SaleItem.original_subtotal), 0).label('revenue_original'),
        func.coalesce(func.sum(SaleItem.quantity * Product.cost_price), 0).label('cost_usd'),
        func.coalesce(func.sum(SaleItem.quantity * Product.original_cost_price), 0).label('cost_original'),
    ).join(SaleItem, SaleItem.product_id == Product.id)\
     .join(Sale, Sale.id == SaleItem.sale_id)\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed',
        business_filter
     ).group_by(Product.id, Product.name)\
     .order_by(desc(func.sum(SaleItem.subtotal)))\
     .limit(15).all()

    profitability_list = []
    for p in profitability:
        revenue_usd = float(p[2] or 0)
        revenue_original = float(p[3] or 0)
        cost_usd = float(p[4] or 0)
        cost_original = float(p[5] or 0)

        profit_usd = revenue_usd - cost_usd
        profit_original = revenue_original - cost_original
        margin = (profit_usd / revenue_usd * 100) if revenue_usd > 0 else 0

        profitability_list.append({
            'product_id': p[0],
            'product_name': p[1],
            'revenue': revenue_usd,
            'revenue_original': revenue_original,
            'cost': cost_usd,
            'cost_original': cost_original,
            'profit': profit_usd,
            'profit_original': profit_original,
            'margin': margin,
        })

    # [KEEP ALL EXISTING CASH FLOW CALCULATIONS...]
    # Cash flow analysis
    cash_in_usd_query = db.query(
        func.coalesce(func.sum(Payment.amount), 0).label('total_amount_usd')
    ).join(Sale, Sale.id == Payment.sale_id)\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Payment.status == 'completed',
        business_filter
     ).first()

    cash_in_original_query = db.query(
        func.coalesce(func.sum(Payment.amount / Sale.exchange_rate_at_sale), 0).label('total_amount_original')
    ).join(Sale, Sale.id == Payment.sale_id)\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Payment.status == 'completed',
        business_filter
     ).first()

    cash_in_usd = float(cash_in_usd_query.total_amount_usd or 0) if cash_in_usd_query else 0
    cash_in_original = float(cash_in_original_query.total_amount_original or 0) if cash_in_original_query else 0
    exchange_rate_cash_in = cash_in_usd / cash_in_original if cash_in_original > 0 else 1.0

    cash_out_usd = cogs_usd + operating_expenses_usd
    cash_out_original = cogs_original + operating_expenses_original
    exchange_rate_cash_out = cash_out_usd / cash_out_original if cash_out_original > 0 else 1.0

    net_cash_flow_usd = cash_in_usd - cash_out_usd
    net_cash_flow_original = cash_in_original - cash_out_original
    exchange_rate_net_cash_flow = net_cash_flow_usd / net_cash_flow_original if net_cash_flow_original > 0 else 1.0

    # [KEEP ALL EXISTING EXPENSE BREAKDOWN CALCULATIONS...]
    # Expense breakdown (simplified)
    expenses_in_period = db.query(Expense).filter(
        Expense.date >= start_date,
        Expense.date <= end_date,
        expense_business_filter
    ).all()

    expense_breakdown_map = {}
    for expense in expenses_in_period:
        category_name = "Unknown"
        if expense.category:
            category_name = expense.category.name
        elif expense.category_id:
            category = db.query(ExpenseCategory).filter(ExpenseCategory.id == expense.category_id).first()
            category_name = category.name if category else f"Category_{expense.category_id}"

        if category_name not in expense_breakdown_map:
            expense_breakdown_map[category_name] = {
                'amount_usd': 0,
                'amount_original': 0,
            }

        expense_breakdown_map[category_name]['amount_usd'] += expense.amount
        expense_breakdown_map[category_name]['amount_original'] += expense.original_amount

    expense_breakdown_list = []
    total_expenses_correct = sum(data['amount_original'] for data in expense_breakdown_map.values())

    for category_name, data in expense_breakdown_map.items():
        percentage = (data['amount_original'] / total_expenses_correct * 100) if total_expenses_correct > 0 else 0
        expense_breakdown_list.append({
            "category": category_name,
            "amount": data['amount_usd'],
            "amount_original": data['amount_original'],
            "percentage": percentage,
        })

    # Calculate average exchange rate
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

    business = db.query(Business).first()
    primary_currency = business.currency_code if business else 'USD'

    # ✅ COMPLETE RETURN STATEMENT WITH ALL BLOCKS
    return {
        'summary': {
            'total_revenue': total_revenue_usd,
            'total_revenue_original': total_revenue_original,
            'exchange_rate': avg_exchange_rate,
            'cogs': cogs_usd,
            'primary_currency': primary_currency,
            'cogs_original': cogs_original,
            'gross_profit': gross_profit_usd,
            'gross_profit_original': gross_profit_original,
            'gross_margin': gross_margin,
            'gross_margin_original': gross_margin_original,
            'tax_collected': total_tax_usd,
            'tax_collected_original': tax_collected_original,
            'operating_expenses': operating_expenses_usd,
            'operating_expenses_original': operating_expenses_original,
            'operating_expenses_exchange_rate': operating_expenses_exchange_rate,
            'net_profit': net_profit_usd,
            'net_profit_original': net_profit_original,
            'net_income': net_profit_usd,
            'net_income_original': net_profit_original,
            # 🆕 REFUND FIELDS
            'total_refunds': total_refunds_usd,
            'total_refunds_original': total_refunds_original,
            'refund_count': refund_count,
            'net_revenue': net_revenue_usd,
            'net_revenue_original': net_revenue_original,
            'refund_rate': refund_rate
        },
        'profitability': profitability_list,
        'cash_flow': {
            'cash_in': cash_in_usd,
            'cash_in_original': cash_in_original,
            'cash_in_exchange_rate': exchange_rate_cash_in,
            'cash_out': cash_out_usd,
            'cash_out_original': cash_out_original,
            'cash_out_exchange_rate': exchange_rate_cash_out,
            'net_cash_flow': net_cash_flow_usd,
            'net_cash_flow_original': net_cash_flow_original,
            'net_cash_flow_exchange_rate': exchange_rate_net_cash_flow,
        },
        'expense_breakdown': expense_breakdown_list,
        'refund_breakdown': refund_details,  # 🆕 NEW: Refund details
        'date_range': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        }
    }
