// Report type definitions
export type ReportFormat = 'json' | 'csv' | 'excel';

// Service response interfaces (what the backend returns)
export interface ServiceSalesTrend {
  date: string;
  total_sales: number;
  total_revenue: number;
  business_id: number;
}

export interface ServiceTopProduct {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  business_id: number;
}

// Hook interfaces (what the frontend expects)
export interface HookSalesTrend {
  date: string;
  daily_sales: number;
  transactions: number;
  average_order_value: number;
}

export interface HookTopProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
  profit_margin: number;
}
