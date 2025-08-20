from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.sale import Sale, SaleItem
from app.models.payment import Payment
from app.models.product import Product
from app.models.inventory import InventoryHistory
from app.schemas.sale_schema import SaleCreate
from datetime import datetime, date
from typing import List, Optional

def create_sale(db: Session, sale_data: SaleCreate, user_id: int):
    """Create a new sale transaction with inventory updates"""
    try:
        # Calculate totals
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
        if abs(payment_total - final_total) > 0.01:  # Allow for floating point precision
            raise ValueError("Payment total does not match sale total")
        
        # Create sale transaction
        db_sale = Sale(
            user_id=user_id,
            total_amount=final_total,
            tax_amount=tax_amount,
            payment_status="completed"
        )
        db.add(db_sale)
        db.flush()  # Get sale ID without committing
        
        # Create sale items
        for item_data in sale_items_data:
            db_item = SaleItem(
                sale_id=db_sale.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                subtotal=item_data["subtotal"]
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
        
        # Create payments
        for payment in sale_data.payments:
            db_payment = Payment(
                sale_id=db_sale.id,
                amount=payment.amount,
                payment_method=payment.payment_method,
                transaction_id=payment.transaction_id,
                status="completed"
            )
            db.add(db_payment)
        
        db.commit()
        db.refresh(db_sale)
        return db_sale
        
    except (ValueError, IntegrityError) as e:
        db.rollback()
        raise e

def get_sale(db: Session, sale_id: int):
    """Get a single sale by ID"""
    return db.query(Sale).filter(Sale.id == sale_id).first()

def get_sales(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get multiple sales with optional date filtering"""
    query = db.query(Sale)
    
    if start_date:
        query = query.filter(Sale.created_at >= start_date)
    if end_date:
        # Add 1 day to include the entire end date
        next_day = datetime.combine(end_date, datetime.min.time()).replace(
            day=end_date.day + 1
        )
        query = query.filter(Sale.created_at < next_day)
    
    return query.order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()

def get_daily_sales_report(db: Session, report_date: date):
    """Generate daily sales report"""
    next_day = datetime.combine(report_date, datetime.min.time()).replace(
        day=report_date.day + 1
    )
    
    sales = db.query(Sale).filter(
        Sale.created_at >= report_date,
        Sale.created_at < next_day,
        Sale.payment_status == "completed"
    ).all()
    
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
