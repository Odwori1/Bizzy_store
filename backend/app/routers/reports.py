from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import Optional

from app.database import get_db
from app.core.auth import get_current_user
from app.crud.report import get_sales_report, get_inventory_report, get_financial_report
from app.services.export_service import ExportService
from app.schemas.report_schema import ReportFormat, SalesReportResponse, InventoryReportResponse, FinancialReportResponse

router = APIRouter(
    prefix="/api/reports",
    tags=["reports"]
)

@router.get("/sales", response_model=SalesReportResponse)
def get_sales_analysis(
    start_date: date = Query(default=date.today() - timedelta(days=30)),
    end_date: date = Query(default=date.today()),
    format: ReportFormat = Query(default=ReportFormat.JSON),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get sales analysis report with multiple export options"""
    try:
        report_data = get_sales_report(db, start_date, end_date)
        
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

@router.get("/inventory", response_model=InventoryReportResponse)
def get_inventory_analysis(
    format: ReportFormat = Query(default=ReportFormat.JSON),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get inventory analysis report"""
    try:
        report_data = get_inventory_report(db)
        
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

@router.get("/financial", response_model=FinancialReportResponse)
def get_financial_analysis(
    start_date: date = Query(default=date.today() - timedelta(days=30)),
    end_date: date = Query(default=date.today()),
    format: ReportFormat = Query(default=ReportFormat.JSON),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get financial analysis report"""
    try:
        report_data = get_financial_report(db, start_date, end_date)
        
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

@router.get("/dashboard")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get dashboard metrics for real-time display"""
    try:
        # Today's sales
        today = date.today()
        sales_today = get_sales_report(db, today, today)
        
        # Inventory status
        inventory = get_inventory_report(db)
        
        # Financial snapshot (last 7 days)
        week_ago = today - timedelta(days=7)
        financial = get_financial_report(db, week_ago, today)
        
        return {
            "sales_today": sales_today['summary'],
            "inventory_alerts": len(inventory['low_stock_alerts']),
            "weekly_financial": financial['summary'],
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard metrics failed: {str(e)}")
