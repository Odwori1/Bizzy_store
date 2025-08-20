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

def get_sales_report(db: Session, start_date: date, end_date: date) -> Dict:
    """Generate comprehensive sales report"""
    # Convert dates to datetime for comparison
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())
    
    # Sales summary
    sales_data = db.query(
        func.coalesce(func.sum(Sale.total_amount), 0).label('total_sales'),
        func.coalesce(func.sum(Sale.tax_amount), 0).label('total_tax'),
        func.count(Sale.id).label('total_transactions'),
        func.coalesce(func.avg(Sale.total_amount), 0).label('avg_transaction')
    ).filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed'
    ).first()

    # Payment methods breakdown
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

    # Top products
    top_products = db.query(
        Product.id,
        Product.name,
        func.coalesce(func.sum(SaleItem.quantity), 0).label('quantity_sold'),
        func.coalesce(func.sum(SaleItem.subtotal), 0).label('total_revenue'),
        func.coalesce(func.avg(Product.price), 0).label('avg_price')
    ).join(SaleItem, SaleItem.product_id == Product.id)\
     .join(Sale, Sale.id == SaleItem.sale_id)\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed'
     ).group_by(Product.id, Product.name)\
     .order_by(desc(func.sum(SaleItem.subtotal)))\
     .limit(10).all()

    # Sales trends (daily)
    sales_trends = db.query(
        func.date(Sale.created_at).label('sale_date'),
        func.coalesce(func.sum(Sale.total_amount), 0).label('daily_sales'),
        func.count(Sale.id).label('transactions'),
        func.coalesce(func.avg(Sale.total_amount), 0).label('avg_order_value')
    ).filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed'
    ).group_by(func.date(Sale.created_at))\
     .order_by(func.date(Sale.created_at)).all()

    return {
        'summary': {
            'total_sales': float(sales_data.total_sales),
            'total_tax': float(sales_data.total_tax),
            'total_transactions': sales_data.total_transactions,
            'average_transaction_value': float(sales_data.avg_transaction),
            'payment_methods': payment_methods
        },
        'top_products': [
            {
                'product_id': p[0],
                'product_name': p[1],
                'quantity_sold': p[2],
                'total_revenue': float(p[3]),
                'profit_margin': float((p[3] - (p[2] * p[4] * 0.7)) / p[3] * 100) if p[3] > 0 else 0
            } for p in top_products
        ],
        'sales_trends': [
            {
                'date': trend[0],
                'daily_sales': float(trend[1]),
                'transactions': trend[2],
                'average_order_value': float(trend[3])
            } for trend in sales_trends
        ],
        'date_range': {
            'start_date': start_date,
            'end_date': end_date
        }
    }

def get_inventory_report(db: Session) -> Dict:
    """Generate comprehensive inventory report"""
    # Inventory summary
    inventory_summary = db.query(
        func.count(Product.id).label('total_products'),
        func.coalesce(func.sum(Product.stock_quantity * Product.price), 0).label('total_stock_value'),
        func.sum(case((Product.stock_quantity <= Product.min_stock_level, 1), else_=0)).label('low_stock_items'),
        func.sum(case((Product.stock_quantity == 0, 1), else_=0)).label('out_of_stock_items')
    ).first()

    # Stock movements (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    stock_movements = db.query(
        InventoryHistory.product_id,
        Product.name,
        InventoryHistory.change_type,
        InventoryHistory.quantity_change,
        InventoryHistory.changed_at,
        (InventoryHistory.quantity_change * Product.price).label('value')
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
            'inventory_turnover': 2.5  # Placeholder for turnover calculation
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

def get_financial_report(db: Session, start_date: date, end_date: date) -> Dict:
    """Generate comprehensive financial report"""
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())
    
    # Financial summary
    sales_data = db.query(
        func.coalesce(func.sum(Sale.total_amount), 0).label('total_revenue'),
        func.coalesce(func.sum(Sale.tax_amount), 0).label('tax_collected'),
        func.coalesce(func.sum(SaleItem.quantity * Product.price * 0.7), 0).label('cogs')  # 70% cost assumption
    ).join(SaleItem, SaleItem.sale_id == Sale.id)\
     .join(Product, Product.id == SaleItem.product_id)\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed'
     ).first()

    total_revenue = float(sales_data.total_revenue)
    cogs = float(sales_data.cogs)
    gross_profit = total_revenue - cogs
    gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0

    # Profitability by product
    profitability = db.query(
        Product.id,
        Product.name,
        func.coalesce(func.sum(SaleItem.subtotal), 0).label('revenue'),
        func.coalesce(func.sum(SaleItem.quantity * Product.price * 0.7), 0).label('cost')
    ).join(SaleItem, SaleItem.product_id == Product.id)\
     .join(Sale, Sale.id == SaleItem.sale_id)\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed'
     ).group_by(Product.id, Product.name)\
     .order_by(desc(func.sum(SaleItem.subtotal)))\
     .limit(15).all()

    # Cash flow analysis
    cash_flow = db.query(
        Payment.payment_method,
        func.coalesce(func.sum(Payment.amount), 0).label('total_amount')
    ).join(Sale, Sale.id == Payment.sale_id)\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Payment.status == 'completed'
     ).group_by(Payment.payment_method).all()

    cash_in = sum(float(cf[1]) for cf in cash_flow)
    cash_out = cogs  # Simplified: COGS as cash out
    net_cash_flow = cash_in - cash_out

    return {
        'summary': {
            'total_revenue': total_revenue,
            'cogs': cogs,
            'gross_profit': gross_profit,
            'gross_margin': gross_margin,
            'tax_collected': float(sales_data.tax_collected),
            'net_profit': gross_profit
        },
        'profitability': [
            {
                'product_id': p[0],
                'product_name': p[1],
                'revenue': float(p[2]),
                'cost': float(p[3]),
                'profit': float(p[2] - p[3]),
                'margin': float((p[2] - p[3]) / p[2] * 100) if p[2] > 0 else 0
            } for p in profitability
        ],
        'cash_flow': {
            'cash_in': cash_in,
            'cash_out': cash_out,
            'net_cash_flow': net_cash_flow,
            'payment_method_breakdown': {cf[0]: float(cf[1]) for cf in cash_flow}
        },
        'date_range': {
            'start_date': start_date,
            'end_date': end_date
        }
    }
