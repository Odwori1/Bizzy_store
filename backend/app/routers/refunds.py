from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.crud.refund import process_refund, get_refunds_by_sale, get_refund
from app.schemas.refund_schema import RefundCreate, Refund, SaleWithRefunds
from app.database import get_db
from app.core.auth import get_current_user
# ADD THIS IMPORT
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process refund"
        )

# Get refunds for a sale - Requires sale:read permission
@router.get("/sale/{sale_id}", response_model=List[Refund], dependencies=[Depends(requires_permission("sale:read"))])
def read_refunds_for_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all refunds for a specific sale (requires sale:read permission)"""
    refunds = get_refunds_by_sale(db, sale_id)
    return refunds

# Get a specific refund - Requires sale:read permission
@router.get("/{refund_id}", response_model=Refund, dependencies=[Depends(requires_permission("sale:read"))])
def read_refund(
    refund_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific refund by ID (requires sale:read permission)"""
    refund = get_refund(db, refund_id)
    if not refund:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refund not found"
        )
    return refund
