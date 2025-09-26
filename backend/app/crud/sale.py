from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.sale import Sale, SaleItem
from app.models.payment import Payment
from app.models.product import Product
from app.models.inventory import InventoryHistory
from app.schemas.sale_schema import SaleCreate
from datetime import datetime, date
from typing import List, Optional

# ADD imports
from app.crud.business import get_business_by_user_id
from app.services.currency_service import CurrencyService
import asyncio

def create_sale(db: Session, sale_data: SaleCreate, user_id: int):
    """Create a new sale transaction with inventory updates"""
    try:
        # ADD: Get business currency context
        business = get_business_by_user_id(db, user_id)
        currency_service = CurrencyService(db)

        # Calculate totals (EXISTING CODE - unchanged)
        sale_items_data = []
        total_amount = 0.0

        for item in sale_data.sale_items:
            # Get product and verify stock
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise ValueError(f"Product with ID {item.product_id} not found")

            if product.stock_quantity < item.quantity:
                raise ValueError(f"Insufficient stock for product {product.name}")

            # Calculate subtotal
            subtotal = item.quantity * item.unit_price
            total_amount += subtotal

            sale_items_data.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": subtotal
            })

        # Calculate tax
        tax_amount = total_amount * (sale_data.tax_rate / 100)
        final_total = total_amount + tax_amount

        # Verify payment amounts match total
        payment_total = sum(payment.amount for payment in sale_data.payments)
        if abs(payment_total - final_total) > 0.01:
            raise ValueError("Payment total does not match sale total")

        # ADD: Get business currency for context (but DON'T convert amounts)
        current_rate = 1.0
        local_currency = 'USD'
        if business and business.currency_code:
            local_currency = business.currency_code
            # Get rate for historical context only, not for conversion
            if business.currency_code != 'USD':
                try:
                    current_rate = asyncio.run(currency_service.get_latest_exchange_rate(business.currency_code, 'USD')) or 1.0
                except Exception as e:
                    print(f"Warning: Could not get exchange rate: {e}")
                    current_rate = 1.0

        # Create sale transaction with currency context
        final_total_usd = final_total * current_rate if current_rate != 0 else final_total
        tax_amount_usd = tax_amount * current_rate if current_rate != 0 else tax_amount
        db_sale = Sale(
            user_id=user_id,
            business_id=business.id if business else None,  # Set business_id from the user's business
            total_amount=final_total_usd,        # USD amount for internal reporting
            tax_amount=tax_amount_usd,           # USD tax amount
            usd_amount=final_total_usd,          # USD amount (consistent naming)
            usd_tax_amount=tax_amount_usd,       # USD tax amount
            original_amount=final_total,         # Local amount (preserved)
            original_currency=local_currency,
            exchange_rate_at_sale=current_rate,
            payment_status="completed"
        )
        db.add(db_sale)
        db.flush()  # Get sale ID without committing

        # Create sale items (with currency conversion and historical context)
        for item_data in sale_items_data:
            # User provides local currency amounts - convert to USD for internal storage
            unit_price_usd = item_data["unit_price"] * current_rate  # Local → USD
            subtotal_usd = item_data["subtotal"] * current_rate      # Local → USD

            db_item = SaleItem(
                sale_id=db_sale.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price=unit_price_usd,           # Store USD amount (internal use)
                subtotal=subtotal_usd,               # Store USD amount (internal use)
                original_unit_price=item_data["unit_price"],  # Preserve local amount (user input)
                original_subtotal=item_data["subtotal"],      # Preserve local amount (user input)
                exchange_rate_at_creation=current_rate        # Preserve exchange rate used
            )
            db.add(db_item)

            # Update product inventory
            product = db.query(Product).filter(Product.id == item_data["product_id"]).first()
            previous_quantity = product.stock_quantity
            product.stock_quantity -= item_data["quantity"]

            # Record inventory history
            inventory_history = InventoryHistory(
                product_id=product.id,
                change_type="sale",
                quantity_change=-item_data["quantity"],
                previous_quantity=previous_quantity,
                new_quantity=product.stock_quantity,
                reason=f"Sale #{db_sale.id}",
                changed_by=user_id
            )
            db.add(inventory_history)

        # Create payments (with currency conversion and historical context)
        for payment in sale_data.payments:
            # The amount from the frontend request is in LOCAL CURRENCY (e.g., 100000 UGX)
            local_payment_amount = payment.amount

            # Convert the local payment amount to USD using the sale's rate
            usd_payment_amount = local_payment_amount * current_rate

            db_payment = Payment(
                sale_id=db_sale.id,
                amount=usd_payment_amount,           # Store the CONVERTED USD amount here
                payment_method=payment.payment_method,
                transaction_id=payment.transaction_id,
                status="completed",
                # Store the original local currency values for historical context
                original_amount=local_payment_amount, # Store the LOCAL amount here
                original_currency_code=local_currency,
                exchange_rate_at_payment=current_rate
            )
            db.add(db_payment)

        db.commit()
        db.refresh(db_sale)
        return db_sale

    except (ValueError, IntegrityError) as e:
        db.rollback()
        raise e

def get_sale(db: Session, sale_id: int, business_id: int = None):
    """Get a specific sale by ID with virtual numbering"""
    # First get the sale with business filtering
    query = db.query(Sale)
    if business_id is not None:
        query = query.filter(Sale.business_id == business_id)
    
    sale = query.filter(Sale.id == sale_id).first()
    
    if sale and business_id is not None:
        # Calculate virtual numbering for this sale
        business_sales = db.query(Sale.id).filter(
            Sale.business_id == business_id
        ).order_by(Sale.created_at).all()
        
        # Create mapping of sale_id to sequence number
        sale_id_to_number = {sale_id: idx + 1 for idx, (sale_id,) in enumerate(business_sales)}
        sale.business_sale_number = sale_id_to_number.get(sale.id)
    
    return sale


def get_sales(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    business_id: Optional[int] = None
):
    """Get multiple sales with optional date and business filtering"""
    query = db.query(Sale)

    # ADD THIS FILTER
    if business_id is not None:
        query = query.filter(Sale.business_id == business_id)

    if start_date:
        query = query.filter(Sale.created_at >= start_date)
    if end_date:
        # Add 1 day to include the entire end date
        next_day = datetime.combine(end_date, datetime.min.time()).replace(
            day=end_date.day + 1
        )
        query = query.filter(Sale.created_at < next_day)

    sales = query.order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()

    # 🎯 FIXED: Add virtual business sale numbers (always when business_id is provided)
    if business_id is not None:
        # Get all sales for this business to calculate sequence numbers
        business_sales = db.query(Sale.id).filter(Sale.business_id == business_id).order_by(Sale.created_at).all()
        sale_id_to_number = {sale_id: idx + 1 for idx, (sale_id,) in enumerate(business_sales)}
        
        for sale in sales:
            sale.business_sale_number = sale_id_to_number.get(sale.id, sale.id)
    else:
        # If no business filter, use database ID as fallback
        for sale in sales:
            sale.business_sale_number = sale.id

    # Eager load user relationship for user_name
    for sale in sales:
        if sale.user:
            sale.user_name = sale.user.username

    return sales

def get_daily_sales_report(db: Session, report_date: date, business_id: Optional[int] = None):
    """Generate daily sales report for a specific business"""
    next_day = datetime.combine(report_date, datetime.min.time()).replace(
        day=report_date.day + 1
    )

    query = db.query(Sale).filter(
        Sale.created_at >= report_date,
        Sale.created_at < next_day,
        Sale.payment_status == "completed"
    )
    # ADD THIS FILTER
    if business_id is not None:
        query = query.filter(Sale.business_id == business_id)

    sales = query.all()
    
    # 🎯 NEW: Add virtual business sale numbers for report sales
    if business_id is not None and sales:
        business_sales = db.query(Sale.id).filter(Sale.business_id == business_id).order_by(Sale.created_at).all()
        sale_id_to_number = {sale_id: idx + 1 for idx, (sale_id,) in enumerate(business_sales)}
        
        for sale in sales:
            sale.business_sale_number = sale_id_to_number.get(sale.id, sale.id)

    total_sales = sum(sale.total_amount for sale in sales)
    total_tax = sum(sale.tax_amount for sale in sales)

    # Count payment methods
    payment_methods = {}
    for sale in sales:
        for payment in sale.payments:
            method = payment.payment_method
            payment_methods[method] = payment_methods.get(method, 0) + 1

    return {
        "date": report_date.isoformat(),
        "total_sales": total_sales,
        "total_tax": total_tax,
        "total_transactions": len(sales),
        "payment_methods": payment_methods
    }
