from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.crud.sale import create_sale, get_sale, get_sales, get_daily_sales_report
from app.schemas.sale_schema import SaleCreate, Sale, SaleSummary, DailySalesReport
from app.database import get_db
from app.core.auth import get_current_user
from app.schemas.refund_schema import SaleWithRefunds  # <-- ADD

router = APIRouter(
    prefix="/api/sales",
    tags=["sales"]
)

@router.post("/", response_model=Sale, status_code=status.HTTP_201_CREATED)
def create_new_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new sale transaction"""
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

@router.get("/", response_model=List[SaleSummary])
def read_sales(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get sales history with optional date filtering"""
    sales = get_sales(db, skip, limit, start_date, end_date)
    
    # Convert to summary format with user names
    result = []
    for sale in sales:
        result.append({
            "id": sale.id,
            "total_amount": sale.total_amount,
            "tax_amount": sale.tax_amount,
            "payment_status": sale.payment_status,
            "created_at": sale.created_at,
            "user_name": sale.user.username if sale.user else "Unknown"
        })
    
    return result

@router.get("/{sale_id}", response_model=Sale)
def read_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed sale information"""
    sale = get_sale(db, sale_id)
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found"
        )
    return sale

@router.get("/reports/daily", response_model=DailySalesReport)
def get_daily_report(
    report_date: date = date.today(),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get daily sales report"""
    report = get_daily_sales_report(db, report_date)
    return report

@router.get("/{sale_id}/with-refunds", response_model=SaleWithRefunds)
def read_sale_with_refunds(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed sale information including refund history"""
    sale = get_sale(db, sale_id)
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found"
        )
    return sale

