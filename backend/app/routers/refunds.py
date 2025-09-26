from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.crud.refund import process_refund, get_refunds_by_sale, get_refund, get_refunds_by_business
from app.schemas.refund_schema import RefundCreate, Refund, SaleWithRefunds
from app.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import requires_permission

router = APIRouter(
    prefix="/api/refunds",
    tags=["refunds"]
)

# Process a refund - Requires sale:refund permission
@router.post("/", response_model=Refund, status_code=status.HTTP_201_CREATED, dependencies=[Depends(requires_permission("sale:refund"))])
def create_refund(
    refund: RefundCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Process a new refund (requires sale:refund permission)"""
    try:
        return process_refund(db, refund, current_user["id"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # 🚨 ADD DETAILED ERROR LOGGING
        print(f"❌ Refund creation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process refund: {str(e)}"
        )

# Get refunds for a sale - Requires sale:read permission
@router.get("/sale/{sale_id}", response_model=List[Refund], dependencies=[Depends(requires_permission("sale:read"))])
def read_refunds_for_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all refunds for a specific sale (requires sale:read permission)"""
    business_id = current_user.get("business_id")
    refunds = get_refunds_by_sale(db, sale_id, business_id)
    return refunds

# Get a specific refund - Requires sale:read permission
@router.get("/{refund_id}", response_model=Refund, dependencies=[Depends(requires_permission("sale:read"))])
def read_refund(
    refund_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific refund by ID (requires sale:read permission)"""
    business_id = current_user.get("business_id")
    refund = get_refund(db, refund_id, business_id)
    if not refund:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refund not found"
        )
    return refund

# Get all refunds for current user's business - Requires sale:read permission
@router.get("/", response_model=List[Refund], dependencies=[Depends(requires_permission("sale:read"))])
def read_refunds(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all refunds for current user's business with virtual numbering"""
    business_id = current_user.get("business_id")
    if not business_id:
        raise HTTPException(status_code=400, detail="Business ID required")

    # We need to create this function in crud/refund.py
    refunds = get_refunds_by_business(db, business_id, skip=skip, limit=limit)
    return refunds

