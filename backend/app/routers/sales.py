from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.crud.sale import create_sale, get_sale, get_sales, get_daily_sales_report
from app.schemas.sale_schema import SaleCreate, Sale, SaleSummary, DailySalesReport
from app.database import get_db
from app.core.auth import get_current_user
from app.schemas.refund_schema import SaleWithRefunds
# ADD THIS IMPORT
from app.core.permissions import requires_permission

router = APIRouter(
    prefix="/api/sales",
    tags=["sales"]
)

# Create a new sale - Requires sale:create permission
@router.post("/", response_model=Sale, status_code=status.HTTP_201_CREATED, dependencies=[Depends(requires_permission("sale:create"))])
def create_new_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new sale transaction (requires sale:create permission)"""
    try:
        return create_sale(db, sale, current_user["id"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create sale"
        )

@router.get("/", response_model=List[SaleSummary], dependencies=[Depends(requires_permission("sale:read"))])
def read_sales(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get sales history with optional date filtering (requires sale:read permission)"""
    # ADD THIS LINE to get business_id from the current user's token
    business_id = current_user.get("business_id")

    # UPDATE THIS LINE to pass business_id to get_sales
    sales = get_sales(db, skip, limit, start_date, end_date, business_id)

    # 🎯 FIX: Use the Sale objects directly (they already have virtual numbers from CRUD)
    # Convert to summary format while preserving virtual numbers
    result = []
    for sale in sales:
        result.append(SaleSummary(
            id=sale.id,
            business_sale_number=getattr(sale, 'business_sale_number', None),  # 🎯 PRESERVE VIRTUAL NUMBER
            total_amount=sale.total_amount,
            tax_amount=sale.tax_amount,
            payment_status=sale.payment_status,
            created_at=sale.created_at,
            user_name=sale.user.username if sale.user else "Unknown",
            original_amount=sale.original_amount,
            original_currency=sale.original_currency,
            exchange_rate_at_sale=sale.exchange_rate_at_sale
        ))

    return result

@router.get("/{sale_id}", response_model=Sale, dependencies=[Depends(requires_permission("sale:read"))])
def read_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed sale information (requires sale:read permission)"""
    # ADD THIS LINE to get business_id from the current user's token
    business_id = current_user.get("business_id")

    # UPDATE THIS LINE to pass business_id to get_sale
    sale = get_sale(db, sale_id, business_id)

    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found"
        )
    return sale

@router.get("/reports/daily", response_model=DailySalesReport, dependencies=[Depends(requires_permission("sale:read"))])
def get_daily_report(
    report_date: date = date.today(),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get daily sales report (requires sale:read permission)"""
    # ADD THIS LINE to get business_id from the current user's token
    business_id = current_user.get("business_id")
    
    # UPDATE THIS LINE to pass business_id to get_daily_sales_report
    report = get_daily_sales_report(db, report_date, business_id)
    return report

@router.get("/{sale_id}/with-refunds", response_model=SaleWithRefunds, dependencies=[Depends(requires_permission("sale:read"))])
def read_sale_with_refunds(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed sale information including refund history (requires sale:read permission)"""
    # ADD THIS LINE to get business_id from the current user's token
    business_id = current_user.get("business_id")

    # UPDATE THIS LINE to pass business_id to get_sale
    sale = get_sale(db, sale_id, business_id)

    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found"
        )
    return sale
