// Type fixes for the application
type ReportFormat = 'json' | 'csv' | 'excel';

interface BusinessCreate {
  name: string;
  currency_code: string;
  timezone?: string;
}

interface BusinessUpdate extends Partial<BusinessCreate> {
  id: number;
}

interface SalesTrend {
  date: string;
  total_sales: number;
  total_revenue: number;
  business_id: number;
}

interface TopProduct {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  business_id: number;
}
