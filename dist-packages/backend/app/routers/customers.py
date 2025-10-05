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
# ADD THIS IMPORT
from app.core.permissions import requires_permission

router = APIRouter(
    prefix="/api/customers",
    tags=["customers"]
)

# Create a new customer - Requires customer:create permission
@router.post("/", response_model=Customer, status_code=status.HTTP_201_CREATED, dependencies=[Depends(requires_permission("customer:create"))])
def create_new_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new customer (requires customer:create permission)"""
    # 🚨 FIX: Get business_id from current user
    business_id = current_user.get("business_id")
    if not business_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account is not associated with a business"
        )

    # Check if email already exists (with business filtering)
    if customer.email:
        db_customer = get_customer_by_email(db, customer.email, business_id)
        if db_customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # 🚨 FIX: Pass business_id to create_customer
    return create_customer(db, customer, business_id)

# Get all customers - Requires customer:read permission
# Get customer by ID - Requires customer:read permission
@router.get("/{customer_id}", response_model=Customer)
def read_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get customer by ID with business isolation"""
    # 🚨 CRITICAL FIX: Pass business_id to get_customer
    business_id = current_user.get("business_id")
    customer = get_customer(db, customer_id, business_id)
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    return customer

# Get all customers - Requires customer:read permission
@router.get("/", response_model=List[Customer], dependencies=[Depends(requires_permission("customer:read"))])
def read_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all customers from current user's business"""
    business_id = current_user.get("business_id")
    if not business_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account is not associated with a business"
        )
    
    customers = get_customers(db, skip=skip, limit=limit, business_id=business_id)
    return customers

# Update customer information - Requires customer:update permission
# Update customer information - Requires customer:update permission
@router.put("/{customer_id}", response_model=Customer, dependencies=[Depends(requires_permission("customer:update"))])
def update_existing_customer(
    customer_id: int,
    customer: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update customer information (requires customer:update permission)"""
    # 🚨 FIX: Add business_id filtering
    business_id = current_user.get("business_id")
    db_customer = get_customer(db, customer_id, business_id)  # ✅ ADD business_id
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    # Check if email is being changed to an existing email
    if customer.email and customer.email != db_customer.email:
        existing_customer = get_customer_by_email(db, customer.email, business_id)  # ✅ ADD business_id
        if existing_customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered to another customer"
            )

    return update_customer(db, customer_id, customer, business_id)  # ✅ ADD business_id

# Delete a customer - Requires customer:delete permission
# Delete a customer - Requires customer:delete permission
@router.delete("/{customer_id}", dependencies=[Depends(requires_permission("customer:delete"))])
def delete_existing_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a customer (requires customer:delete permission)"""
    # 🚨 FIX: Add business_id filtering
    business_id = current_user.get("business_id")
    customer = get_customer(db, customer_id, business_id)  # ✅ ADD business_id
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    delete_customer(db, customer_id, business_id)  # ✅ ADD business_id
    return {"message": "Customer deleted successfully"}

# Get customer purchase history - Requires customer:read permission
# Get customer purchase history - Requires customer:read permission
@router.get("/{customer_id}/purchase-history", response_model=List[CustomerPurchaseHistory], dependencies=[Depends(requires_permission("customer:read"))])
def get_customer_history(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get customer purchase history (requires customer:read permission)"""
    # 🚨 FIX: Add business_id filtering
    business_id = current_user.get("business_id")
    customer = get_customer(db, customer_id, business_id)  # ✅ ADD business_id
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    return get_customer_purchase_history(db, customer_id, business_id)  # ✅ ADD business_id
