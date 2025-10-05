from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.models.customer import Customer
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.schemas.customer_schema import CustomerCreate, CustomerUpdate

def get_customer(db: Session, customer_id: int, business_id: int = None):
    """Get customer by ID, filtered by business_id if provided"""
    query = db.query(Customer).filter(Customer.id == customer_id)
    
    # 🚨 CRITICAL FIX: Add business filtering
    if business_id is not None:
        query = query.filter(Customer.business_id == business_id)
        
    return query.first()

def get_customer_by_email(db: Session, email: str, business_id: int = None):
    """Get customer by email, filtered by business_id if provided"""
    query = db.query(Customer).filter(Customer.email == email)
    
    # 🚨 FIX: Added missing query initialization and business filtering
    if business_id is not None:
        query = query.filter(Customer.business_id == business_id)

    return query.first()

def get_customers(db: Session, skip: int = 0, limit: int = 100, business_id: int = None):
    """Get customers with pagination, filtered by business_id if provided"""
    query = db.query(Customer)

    if business_id is not None:
        query = query.filter(Customer.business_id == business_id)

    return query.offset(skip).limit(limit).all()

def create_customer(db: Session, customer: CustomerCreate, business_id: int):
    """Create a new customer with business_id"""
    # 🚨 FIX: Added business_id parameter and set it in the customer creation
    db_customer = Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        address=customer.address,
        business_id=business_id  # 🎯 CRITICAL: Set the business_id
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def update_customer(db: Session, customer_id: int, customer: CustomerUpdate, business_id: int = None):
    """Update customer information with business filtering"""
    query = db.query(Customer).filter(Customer.id == customer_id)
    
    if business_id is not None:
        query = query.filter(Customer.business_id == business_id)
        
    db_customer = query.first()
    
    if db_customer:
        for key, value in customer.dict(exclude_unset=True).items():
            setattr(db_customer, key, value)
        db.commit()
        db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int, business_id: int = None):
    """Delete customer with business filtering"""
    query = db.query(Customer).filter(Customer.id == customer_id)
    
    if business_id is not None:
        query = query.filter(Customer.business_id == business_id)
        
    db_customer = query.first()
    
    if db_customer:
        db.delete(db_customer)
        db.commit()
    return db_customer

def get_customer_purchase_history(db: Session, customer_id: int, business_id: int = None):
    """Get customer purchase history with business filtering"""
    query = db.query(Sale).filter(Sale.customer_id == customer_id)
    
    if business_id is not None:
        query = query.filter(Sale.business_id == business_id)
        
    sales = query.all()

    history = []
    for sale in sales:
        items = db.query(SaleItem, Product.name).join(
            Product, SaleItem.product_id == Product.id
        ).filter(SaleItem.sale_id == sale.id).all()

        item_names = [item.name for _, item in items]
        history.append({
            "sale_id": sale.id,
            "total_amount": sale.total_amount,
            "created_at": sale.created_at,
            "items": item_names
        })

    return history

def update_customer_loyalty(db: Session, customer_id: int, amount_spent: float, business_id: int = None):
    """Update customer loyalty with business filtering"""
    query = db.query(Customer).filter(Customer.id == customer_id)
    
    if business_id is not None:
        query = query.filter(Customer.business_id == business_id)
        
    db_customer = query.first()
    
    if db_customer:
        # Update total spent
        db_customer.total_spent += amount_spent

        # Calculate loyalty points (1 point per $10 spent)
        points_earned = int(amount_spent / 10)
        db_customer.loyalty_points += points_earned

        # Update last purchase date
        db_customer.last_purchase = func.now()

        db.commit()
        db.refresh(db_customer)

    return db_customer
