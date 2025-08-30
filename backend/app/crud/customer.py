from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.models.customer import Customer
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.schemas.customer_schema import CustomerCreate, CustomerUpdate

def get_customer(db: Session, customer_id: int):
    return db.query(Customer).filter(Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(Customer).filter(Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Customer).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: CustomerCreate):
    db_customer = Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        address=customer.address
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def update_customer(db: Session, customer_id: int, customer: CustomerUpdate):
    db_customer = get_customer(db, customer_id)
    if db_customer:
        for key, value in customer.dict(exclude_unset=True).items():
            setattr(db_customer, key, value)
        db.commit()
        db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if db_customer:
        db.delete(db_customer)
        db.commit()
    return db_customer

def get_customer_purchase_history(db: Session, customer_id: int):
    sales = db.query(Sale).filter(Sale.customer_id == customer_id).all()
    
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

def update_customer_loyalty(db: Session, customer_id: int, amount_spent: float):
    db_customer = get_customer(db, customer_id)
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
