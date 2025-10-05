#!/usr/bin/env python3
"""
Script to update just the get_sales_report function in crud/report.py
"""
import re

# Read the current file
with open('app/crud/report.py', 'r') as f:
    content = f.read()

# Replace the get_sales_report function with the fixed version
new_sales_report_function = '''
def get_sales_report(db: Session, start_date: date, end_date: date) -> Dict:
    """Generate comprehensive sales report USING PRESERVED LOCAL CURRENCY AMOUNTS"""
    # Convert dates to datetime for comparison
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    # Sales summary - USING LOCAL CURRENCY (original_amount) for accurate business reporting
    sales_data = db.query(
        func.coalesce(func.sum(Sale.original_amount), 0).label('total_sales'),
        func.coalesce(func.sum(Sale.tax_amount / Sale.exchange_rate_at_sale), 0).label('total_tax'),
        func.count(Sale.id).label('total_transactions'),
        func.coalesce(func.avg(Sale.original_amount), 0).label('avg_transaction')
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
    ).group_by(Sale.original_currency)\\
     .order_by(desc(func.count(Sale.id)))\\
     .first()
    
    primary_currency = primary_currency_query[0] if primary_currency_query else 'USD'

    # Payment methods breakdown (unchanged - counts are currency-agnostic)
    payment_methods_query = db.query(
        Payment.payment_method,
        func.count(Payment.id).label('count')
    ).join(Sale, Sale.id == Payment.sale_id)\\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Payment.status == 'completed'
     ).group_by(Payment.payment_method).all()

    payment_methods = {pmt[0]: pmt[1] for pmt in payment_methods_query}

    # Top products - USING LOCAL CURRENCY (original_subtotal from sale_items)
    top_products = db.query(
        Product.id,
        Product.name,
        func.coalesce(func.sum(SaleItem.quantity), 0).label('quantity_sold'),
        func.coalesce(func.sum(SaleItem.original_subtotal), 0).label('total_revenue'),
        func.coalesce(func.avg(SaleItem.original_unit_price), 0).label('avg_price'),
        func.coalesce(func.avg(Product.original_cost_price), 0).label('avg_cost_price')
    ).join(SaleItem, SaleItem.product_id == Product.id)\\
     .join(Sale, Sale.id == SaleItem.sale_id)\\
     .filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed'
     ).group_by(Product.id, Product.name)\\
     .order_by(desc(func.sum(SaleItem.original_subtotal)))\\
     .limit(10).all()

    # Sales trends (daily) - USING LOCAL CURRENCY
    sales_trends = db.query(
        func.date(Sale.created_at).label('sale_date'),
        func.coalesce(func.sum(Sale.original_amount), 0).label('daily_sales'),
        func.count(Sale.id).label('transactions'),
        func.coalesce(func.avg(Sale.original_amount), 0).label('avg_order_value')
    ).filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.payment_status == 'completed'
    ).group_by(func.date(Sale.created_at))\\
     .order_by(func.date(Sale.created_at)).all()

    return {
        'summary': {
            'total_sales': float(sales_data.total_sales),
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
                'profit_margin': float((p[3] - (p[2] * p[5])) / p[3] * 100) if p[3] > 0 and p[5] > 0 else 0
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
'''

# Replace the old function with the new one
pattern = r'def get_sales_report\(db: Session, start_date: date, end_date: date\) -> Dict:.*?return.*?}'
updated_content = re.sub(pattern, new_sales_report_function, content, flags=re.DOTALL)

# Write the updated content back
with open('app/crud/report.py', 'w') as f:
    f.write(updated_content)

print("✅ Updated get_sales_report function")
