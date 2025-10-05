from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import Optional
from typing import List
from sqlalchemy import func
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.schemas.report_schema import SalesTrend, TopProduct

from app.database import get_db
from app.core.auth import get_current_user
from app.crud.report import get_sales_report, get_inventory_report, get_financial_report
from app.services.export_service import ExportService
from app.schemas.report_schema import ReportFormat, SalesReportResponse, InventoryReportResponse, FinancialReportResponse, FinancialReportResponseWithRefunds
# ADD THIS IMPORT
from app.core.permissions import requires_permission

router = APIRouter(
    prefix="/api/reports",
    tags=["reports"]
)

# Get sales analysis report - Requires report:view permission
@router.get("/sales", response_model=SalesReportResponse, dependencies=[Depends(requires_permission("report:view"))])
def get_sales_analysis(
    start_date: date = Query(default=date.today() - timedelta(days=30)),
    end_date: date = Query(default=date.today()),
    format: ReportFormat = Query(default=ReportFormat.JSON),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get sales analysis report with multiple export options (requires report:view permission)"""
    try:
        business_id = current_user.get('business_id')
        report_data = get_sales_report(db, start_date, end_date, business_id)

        if format == ReportFormat.EXCEL:
            filename = f"sales_report_{start_date}_{end_date}"
            return ExportService.export_sales_to_excel(report_data, filename)
        elif format == ReportFormat.CSV:
            filename = f"sales_report_{start_date}_{end_date}"
            return ExportService.export_sales_to_csv(report_data, filename)
        else:
            return report_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sales report generation failed: {str(e)}")

# Get inventory analysis report - Requires report:view permission
@router.get("/inventory", response_model=InventoryReportResponse, dependencies=[Depends(requires_permission("report:view"))])
def get_inventory_analysis(
    format: ReportFormat = Query(default=ReportFormat.JSON),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get inventory analysis report (requires report:view permission)"""
    try:
        business_id = current_user.get('business_id')
        report_data = get_inventory_report(db, business_id)

        if format == ReportFormat.EXCEL:
            filename = f"inventory_report_{date.today()}"
            return ExportService.export_inventory_to_excel(report_data, filename)
        elif format == ReportFormat.CSV:
            filename = f"inventory_report_{date.today()}"
            # Implement CSV export for inventory
            raise HTTPException(status_code=501, detail="CSV export for inventory not implemented yet")
        else:
            return report_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory report generation failed: {str(e)}")

# Get financial analysis report - Requires report:view permission
# Get financial analysis report WITH REFUND SUPPORT - Requires report:view permission
@router.get("/financial", response_model=FinancialReportResponseWithRefunds, dependencies=[Depends(requires_permission("report:view"))])
def get_financial_analysis(
    start_date: date = Query(default=date.today() - timedelta(days=30)),
    end_date: date = Query(default=date.today()),
    format: ReportFormat = Query(default=ReportFormat.JSON),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get financial analysis report with refund breakdown (requires report:view permission)"""
    try:
        # FIX: Get business_id from current user and pass it to the report
        business_id = current_user.get('business_id')

        report_data = get_financial_report(db, start_date, end_date, business_id)

        if format == ReportFormat.EXCEL:
            filename = f"financial_report_{start_date}_{end_date}"
            return ExportService.export_financial_to_excel(report_data, filename)
        elif format == ReportFormat.CSV:
            filename = f"financial_report_{start_date}_{end_date}"
            # Implement CSV export for financial
            raise HTTPException(status_code=501, detail="CSV export for financial not implemented yet")
        else:
            return report_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Financial report generation failed: {str(e)}")

# In the dashboard endpoint, update line ~120:
@router.get("/dashboard", dependencies=[Depends(requires_permission("report:view"))])
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get dashboard metrics for real-time display (requires report:view permission)"""
    try:
        # Today's sales
        today = date.today()
        sales_today = get_sales_report(db, today, today, current_user.get('business_id'))

        # Inventory status
        inventory = get_inventory_report(db, current_user.get('business_id'))

        # Financial snapshot (last 7 days) - ADD business_id parameter
        week_ago = today - timedelta(days=7)
        financial = get_financial_report(db, week_ago, today, current_user.get('business_id'))

        return {
            "sales_today": sales_today['summary'],
            "inventory_alerts": len(inventory['low_stock_alerts']),
            "weekly_financial": financial['summary'],
            "timestamp": datetime.now()
        }  # ← ADD MISSING CLOSING BRACE

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard metrics failed: {str(e)}")

# Get sales trends data - Requires report:view permission
@router.get("/sales/trends", response_model=List[SalesTrend], dependencies=[Depends(requires_permission("report:view"))])
def get_sales_trends(
    start_date: date = Query(default=date.today() - timedelta(days=7)),
    end_date: date = Query(default=date.today()),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get sales trends data for charts (requires report:view permission)"""
    try:
        business_id = current_user.get("business_id")
        if not business_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not associated with a business"
            )
        
        # Convert dates to datetime for proper comparison with Sale.created_at
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        # Query sales data grouped by date - INCLUDING ORIGINAL AMOUNTS
        sales_data = db.query(
            func.date(Sale.created_at).label('date'),
            func.sum(Sale.total_amount).label('daily_sales'),
            func.sum(Sale.original_amount).label('daily_sales_original'),
            func.count(Sale.id).label('transactions'),
            func.avg(Sale.total_amount).label('average_order_value')
        ).filter(
            Sale.created_at >= start_dt,
            Sale.created_at <= end_dt,
            Sale.payment_status == 'completed',
            Sale.business_id == business_id  # ← CRITICAL SECURITY FIX
        ).group_by(func.date(Sale.created_at)).order_by('date').all()

        # Format the response
        trends = []
        for data in sales_data:
            trends.append({
                "date": data.date,
                "daily_sales": float(data.daily_sales or 0),
                "daily_sales_original": float(data.daily_sales_original or 0),
                "transactions": data.transactions or 0,
                "average_order_value": float(data.average_order_value or 0)
            })

        return trends

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sales trends: {str(e)}")

# Get top selling products - Requires report:view permission
@router.get("/products/top", response_model=List[TopProduct], dependencies=[Depends(requires_permission("report:view"))])
def get_top_products(
    start_date: date = Query(default=date.today() - timedelta(days=30)),
    end_date: date = Query(default=date.today()),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get top selling products (requires report:view permission)"""
    try:
        business_id = current_user.get("business_id")
        if not business_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not associated with a business"
            )

        # Convert dates to datetime for proper comparison with Sale.created_at
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        # Query top products by revenue - FIXED FIELD MAPPING
        top_products = db.query(
            Product.id.label('product_id'),
            Product.name.label('product_name'),
            func.sum(SaleItem.quantity).label('quantity_sold'),
            func.sum(SaleItem.subtotal).label('total_revenue'),
            func.sum(SaleItem.original_subtotal).label('total_revenue_original'),
            (func.avg(Product.price * 0.2)).label('profit_margin')
        ).join(SaleItem, SaleItem.product_id == Product.id
        ).join(Sale, Sale.id == SaleItem.sale_id
        ).filter(
            Sale.created_at >= start_dt,
            Sale.created_at <= end_dt,
            Sale.payment_status == 'completed',
            Sale.business_id == business_id  # ← CRITICAL SECURITY FIX
        ).group_by(Product.id, Product.name
        ).order_by(func.sum(SaleItem.subtotal).desc()
        ).limit(limit).all()

        # Format the response
        products = []
        for product in top_products:
            products.append({
                "product_id": product.product_id,
                "product_name": product.product_name,
                "quantity_sold": product.quantity_sold or 0,
                "total_revenue": float(product.total_revenue or 0),
                "total_revenue_original": float(product.total_revenue_original or 0),
                "profit_margin": float(product.profit_margin or 0)
            })

        return products

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching top products: {str(e)}")
