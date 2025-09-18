from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from enum import Enum

class ReportFormat(str, Enum):
    JSON = "json"
    EXCEL = "excel"
    CSV = "csv"

class DateRange(BaseModel):
    start_date: date
    end_date: date

class SalesSummary(BaseModel):
    total_sales: float  # USD amount
    total_sales_original: float  # Local currency amount
    total_tax: float
    total_transactions: int
    average_transaction_value: float
    payment_methods: Dict[str, int]
    primary_currency: str

class TopProduct(BaseModel):
    product_id: int
    product_name: str
    quantity_sold: int
    total_revenue: float  # USD amount
    total_revenue_original: float  # Local currency amount
    profit_margin: Optional[float] = None

class SalesTrend(BaseModel):
    date: date
    daily_sales: float  # USD amount
    daily_sales_original: float  # Local currency amount
    transactions: int
    average_order_value: float

class SalesReportResponse(BaseModel):
    summary: SalesSummary
    top_products: List[TopProduct]
    sales_trends: List[SalesTrend]
    date_range: DateRange

class InventorySummary(BaseModel):
    total_products: int
    total_stock_value: float
    low_stock_items: int
    out_of_stock_items: int
    inventory_turnover: float

class StockMovement(BaseModel):
    product_id: int
    product_name: str
    movement_type: str
    quantity: int
    value: float
    date: date

class InventoryReportResponse(BaseModel):
    summary: InventorySummary
    stock_movements: List[StockMovement]
    low_stock_alerts: List[dict]

class FinancialSummary(BaseModel):
    total_revenue: float
    total_revenue_original: float
    exchange_rate: float  # ADDED: Historical exchange rate
    cogs: float
    cogs_original: float
    gross_profit: float
    gross_profit_original: float
    gross_margin: float
    gross_margin_original: float
    tax_collected: float
    tax_collected_original: float
    operating_expenses: float
    operating_expenses_original: float
    net_profit: float
    net_profit_original: float
    net_income: float
    net_income_original: float

    class Config:
        orm_mode = True

class ProfitabilityAnalysis(BaseModel):
    product_id: int
    product_name: str
    revenue: float
    cost: float
    profit: float
    margin: float

class CashFlowSummary(BaseModel):
    cash_in: float
    cash_out: float
    net_cash_flow: float
    payment_method_breakdown: Dict[str, float]

class FinancialReportResponse(BaseModel):
    summary: FinancialSummary
    profitability: List[ProfitabilityAnalysis]  # FIXED: Added missing closing bracket
    cash_flow: CashFlowSummary
    expense_breakdown: List[Dict[str, Any]]
    date_range: DateRange
