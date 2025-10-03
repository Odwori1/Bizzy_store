# ~/Bizzy_store/backend/app/crud/sale.py - COMPLETE FIXED VERSION
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.sale import Sale, SaleItem
from app.models.payment import Payment
from app.models.product import Product
from app.models.inventory import InventoryHistory
from app.schemas.sale_schema import SaleCreate
from datetime import datetime, date
from typing import List, Optional
from app.crud.business import get_business_by_user_id
from app.services.currency_service import CurrencyService
from app.services.sequence_service import SequenceService
import asyncio
from sqlalchemy.orm import joinedload

def create_sale(db: Session, sale_data: SaleCreate, user_id: int):
    """Create a new sale transaction with inventory updates - FIXED VERSION"""
    try:
        # Get business currency context
        business = get_business_by_user_id(db, user_id)
        if not business:
            raise ValueError("User business not found")
        currency_service = CurrencyService(db)

        # Calculate totals
        sale_items_data = []
        total_amount = 0.0

        for item in sale_data.sale_items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise ValueError(f"Product with ID {item.product_id} not found")
            if product.stock_quantity < item.quantity:
                raise ValueError(f"Insufficient stock for product {product.name}")

            subtotal = item.quantity * item.unit_price
            total_amount += subtotal
            sale_items_data.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": subtotal
            })

        # Calculate tax and final total
        tax_rate = sale_data.tax_rate if sale_data.tax_rate else 0.0
        tax_amount = total_amount * (tax_rate / 100)
        final_total = total_amount + tax_amount

        # Verify payment amounts match total
        payment_total = sum(payment.amount for payment in sale_data.payments)
        if abs(payment_total - final_total) > 0.01:
            raise ValueError("Payment total does not match sale total")

        # Get exchange rate
        current_rate = 1.0
        local_currency = 'USD'
        if business and business.currency_code:
            local_currency = business.currency_code
            if business.currency_code != 'USD':
                try:
                    current_rate = asyncio.run(currency_service.get_latest_exchange_rate(business.currency_code, 'USD')) or 1.0
                except Exception as e:
                    print(f"Warning: Could not get exchange rate: {e}")
                    current_rate = 1.0

        # FIXED PATTERN: Get sequence number FIRST (within transaction)
        business_sale_number = SequenceService.get_next_number(db, business.id, 'sale')

        # Create sale transaction with currency context
        final_total_usd = final_total * current_rate if current_rate != 0 else final_total
        tax_amount_usd = tax_amount * current_rate if current_rate != 0 else tax_amount

        db_sale = Sale(
            user_id=user_id,
            business_id=business.id,
            business_sale_number=business_sale_number,  # Use the sequence number we already obtained
            total_amount=final_total_usd,
            tax_amount=tax_amount_usd,
            usd_amount=final_total_usd,
            usd_tax_amount=tax_amount_usd,
            original_amount=final_total,
            original_currency=local_currency,
            exchange_rate_at_sale=current_rate,
            payment_status="completed"
        )
        db.add(db_sale)
        db.flush()  # Get sale ID without committing

        # Create sale items
        for item_data in sale_items_data:
            unit_price_usd = item_data["unit_price"] * current_rate
            subtotal_usd = item_data["subtotal"] * current_rate

            db_item = SaleItem(
                sale_id=db_sale.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price=unit_price_usd,
                subtotal=subtotal_usd,
                original_unit_price=item_data["unit_price"],
                original_subtotal=item_data["subtotal"],
                exchange_rate_at_creation=current_rate
            )
            db.add(db_item)

            # Update product stock
            product = db.query(Product).filter(Product.id == item_data["product_id"]).first()
            if product:
                previous_quantity = product.stock_quantity
                product.stock_quantity -= item_data["quantity"]

                # FIXED: Add business inventory numbering
                inventory_history = InventoryHistory(
                    product_id=product.id,
                    business_id=business.id,
                    business_inventory_number=SequenceService.get_next_number(db, business.id, 'inventory'),  # ADDED THIS LINE
                    change_type="sale",
                    quantity_change=-item_data["quantity"],
                    previous_quantity=previous_quantity,
                    new_quantity=product.stock_quantity,
                    reason=f"Sale #{business_sale_number}",
                    changed_by=user_id
                )
                db.add(inventory_history)

        # Create payments
        for payment in sale_data.payments:
            local_payment_amount = payment.amount
            usd_payment_amount = local_payment_amount * current_rate

            db_payment = Payment(
                sale_id=db_sale.id,
                amount=usd_payment_amount,
                payment_method=payment.payment_method,
                transaction_id=payment.transaction_id,
                status="completed",
                original_amount=local_payment_amount,
                original_currency_code=local_currency,
                exchange_rate_at_payment=current_rate
            )
            db.add(db_payment)

        # SINGLE COMMIT for everything
        db.commit()
        db.refresh(db_sale)
        return db_sale

    except Exception as e:
        db.rollback()
        raise e

def get_sale(db: Session, sale_id: int, business_id: int = None):
    """Get a specific sale by ID"""
    query = db.query(Sale).options(
        joinedload(Sale.sale_items).joinedload(SaleItem.product)
    )
    if business_id is not None:
        query = query.filter(Sale.business_id == business_id)
    return query.filter(Sale.id == sale_id).first()

def get_sales(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    business_id: Optional[int] = None
):
    """Get multiple sales"""
    query = db.query(Sale)
    if business_id is not None:
        query = query.filter(Sale.business_id == business_id)

    if start_date:
        query = query.filter(Sale.created_at >= start_date)
    if end_date:
        next_day = datetime.combine(end_date, datetime.min.time()).replace(day=end_date.day + 1)
        query = query.filter(Sale.created_at < next_day)

    sales = query.order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()
    for sale in sales:
        if sale.user:
            sale.user_name = sale.user.username
    return sales

def get_daily_sales_report(db: Session, report_date: date, business_id: Optional[int] = None):
    """Generate daily sales report for a specific business"""
    next_day = datetime.combine(report_date, datetime.min.time()).replace(day=report_date.day + 1)
    query = db.query(Sale).filter(
        Sale.created_at >= report_date,
        Sale.created_at < next_day,
        Sale.payment_status == "completed"
    )
    if business_id is not None:
        query = query.filter(Sale.business_id == business_id)

    sales = query.all()
    total_sales = sum(sale.total_amount for sale in sales)
    total_tax = sum(sale.tax_amount for sale in sales)

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
