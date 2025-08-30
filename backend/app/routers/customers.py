from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.crud.customer import (
    get_customer, get_customers, create_customer, update_customer, 
    delete_customer, get_customer_purchase_history, get_customer_by_email
)
from app.schemas.customer_schema import Customer, CustomerCreate, CustomerUpdate, CustomerPurchaseHistory
from app.database import get_db
from app.core.auth import get_current_user

router = APIRouter(
    prefix="/api/customers",
    tags=["customers"]
)

@router.post("/", response_model=Customer, status_code=status.HTTP_201_CREATED)
def create_new_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new customer"""
    # Check if email already exists
    if customer.email:
        db_customer = get_customer_by_email(db, customer.email)
        if db_customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    return create_customer(db, customer)

@router.get("/", response_model=List[Customer])
def read_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all customers"""
    customers = get_customers(db, skip=skip, limit=limit)
    return customers

@router.get("/{customer_id}", response_model=Customer)
def read_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get customer by ID"""
    customer = get_customer(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    return customer

@router.put("/{customer_id}", response_model=Customer)
def update_existing_customer(
    customer_id: int,
    customer: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update customer information"""
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Check if email is being changed to an existing email
    if customer.email and customer.email != db_customer.email:
        existing_customer = get_customer_by_email(db, customer.email)
        if existing_customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered to another customer"
            )
    
    return update_customer(db, customer_id, customer)

@router.delete("/{customer_id}")
def delete_existing_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a customer"""
    customer = get_customer(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    delete_customer(db, customer_id)
    return {"message": "Customer deleted successfully"}

@router.get("/{customer_id}/purchase-history", response_model=List[CustomerPurchaseHistory])
def get_customer_history(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get customer purchase history"""
    customer = get_customer(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    return get_customer_purchase_history(db, customer_id)
