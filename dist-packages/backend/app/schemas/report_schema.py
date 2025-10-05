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

# InventorySummary - Add these two new fields
class InventorySummary(BaseModel):
    total_products: int
    total_stock_value: float
    total_stock_value_original: float  # NEW: Local currency amount
    primary_currency: str  # NEW: Currency code (e.g., "UGX")
    low_stock_items: int
    out_of_stock_items: int
    inventory_turnover: float

# StockMovement - Add these three new fields
class StockMovement(BaseModel):
    product_id: int
    product_name: str
    movement_type: str
    quantity: int
    value: float  # USD amount
    value_original: float  # NEW: Local currency amount
    original_currency_code: str  # NEW: Currency code
    exchange_rate_at_creation: float  # NEW: Historical exchange rate
    date: date

class InventoryReportResponse(BaseModel):
    summary: InventorySummary
    stock_movements: List[StockMovement]
    low_stock_alerts: List[dict]

class FinancialSummary(BaseModel):
    total_revenue: float
    total_revenue_original: float
    exchange_rate: float  # Historical exchange rate
    primary_currency: str
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
    operating_expenses_exchange_rate: float
    net_profit: float
    net_profit_original: float
    net_income: float
    net_income_original: float

    class Config:
        orm_mode = True

class ProfitabilityAnalysis(BaseModel):
    product_id: int
    product_name: str
    revenue: float  # USD amount
    revenue_original: float  # Local currency amount
    cost: float  # USD amount
    cost_original: float  # Local currency amount
    profit: float  # USD amount
    profit_original: float  # Local currency amount
    margin: float
    exchange_rate_revenue: Optional[float] = None
    exchange_rate_cost: Optional[float] = None
    exchange_rate_profit: Optional[float] = None

class CashFlowSummary(BaseModel):
    cash_in: float  # USD amount
    cash_in_original: float  # Local currency amount
    cash_out: float  # USD amount
    cash_out_original: float  # Local currency amount
    net_cash_flow: float  # USD amount
    net_cash_flow_original: float  # Local currency amount
    cash_in_exchange_rate: float
    cash_out_exchange_rate: float
    net_cash_flow_exchange_rate: float
    payment_method_breakdown: Optional[Dict[str, float]] = None

class ExpenseBreakdown(BaseModel):
    category: str
    amount: float  # USD amount
    amount_original: float  # Local currency amount
    percentage: float
    exchange_rate: Optional[float] = None

# Add these new schemas for refund support
class RefundDetail(BaseModel):
    refund_id: int
    business_refund_number: Optional[int] = None  # 🆕 CRITICAL FIX
    sale_id: int
    sale_business_number: Optional[int] = None
    amount: float  # USD amount
    original_amount: float  # Local currency amount
    original_currency: str
    reason: str
    date: datetime
    items: List[Dict[str, Any]] = []

# 🆕 CRITICAL FIX: Add total_transactions field to FinancialSummaryWithRefunds
class FinancialSummaryWithRefunds(FinancialSummary):
    # Add refund fields to existing financial summary
    total_transactions: int = 0  # 🆕 ADD THIS MISSING FIELD
    total_refunds: float = 0.0
    total_refunds_original: float = 0.0
    refund_count: int = 0
    net_revenue: float = 0.0  # total_revenue - total_refunds
    net_revenue_original: float = 0.0
    refund_rate: float = 0.0  # refund_count / total_transactions

class FinancialReportResponseWithRefunds(BaseModel):
    summary: FinancialSummaryWithRefunds
    profitability: List[ProfitabilityAnalysis]
    cash_flow: CashFlowSummary
    expense_breakdown: List[ExpenseBreakdown]
    refund_breakdown: List[RefundDetail] = []  # NEW: Refund details
    date_range: DateRange

class FinancialReportResponse(BaseModel):
    summary: FinancialSummary
    profitability: List[ProfitabilityAnalysis]
    cash_flow: CashFlowSummary
    expense_breakdown: List['ExpenseBreakdown']
    date_range: DateRange
