// User Types - UPDATED FOR RBAC
export interface User {
  id: number;
  email: string;
  username: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  role_name?: string;
  business_id?: number;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
  role: string;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  cost_price: number;
  barcode: string;
  stock_quantity: number;
  min_stock_level: number;
  created_at: string;
  updated_at?: string;
  last_restocked?: string;
  business_id: number;
  business_product_number?: number;
  
  // Historical currency context fields
  original_price?: number;
  original_cost_price?: number;
  original_currency_code?: string;
  exchange_rate_at_creation?: number;
}

export interface ProductCreate {
  name: string;
  description?: string;
  price: number;
  cost_price: number;
  barcode: string;
  stock_quantity: number;
  min_stock_level: number;
  business_id: number;
}

// POS Cart Types
export interface CartItem {
  product_id: number;
  product_name: string;
  product: Product;
  quantity: number;
  unit_price: number;
  original_unit_price?: number;
  original_currency_code?: string;
  subtotal: number;
  exchange_rate_at_creation?: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  tax: number;
  grand_total: number;
}

// Payment processing
export interface PaymentRequest {
  sale_id: number;
  payment_method: 'cash' | 'card' | 'mobile_money';
  amount: number;
  transaction_id?: string;
}

// Sale Types - CORRECTED TO MATCH BACKEND
export interface Sale {
  id: number;
  user_id: number;
  business_id: number;
  business_sale_number: number;
  total_amount: number;
  tax_amount: number;
  payment_status: 'pending' | 'completed' | 'refunded';
  created_at: string;
  
  // Local currency context (MISSING PROPERTIES ADDED)
  original_amount: number;
  original_currency: string;
  exchange_rate_at_sale: number;
  usd_amount: number;
  usd_tax_amount: number;
  customer_id?: number;
  
  // Relationships
  sale_items: SaleItem[];
  payments: Payment[];
  refunds?: Refund[];
  user_name?: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  
  // Local currency context (MISSING PROPERTIES ADDED)
  refunded_quantity: number;
  original_unit_price: number;
  original_subtotal: number;
  exchange_rate_at_creation: number;
  
  product_name?: string;
  product: Product;
}

export interface SaleSummary {
  id: number;
  business_sale_number: number;
  total_amount: number;
  tax_amount: number;
  payment_status: string;
  created_at: string;
  user_name?: string;
  original_amount?: number;
  original_currency?: string;
  exchange_rate_at_sale?: number;
}

export interface Payment {
  id: number;
  amount: number;
  payment_method: 'cash' | 'card' | 'mobile_money';
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  original_amount?: number;
  original_currency?: string;
  exchange_rate_at_payment?: number;
}

export interface SaleCreate {
  user_id: number;
  sale_items: SaleItemCreate[];
  payments: PaymentCreate[];
  tax_rate: number;
}

export interface SaleItemCreate {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface PaymentCreate {
  amount: number;
  payment_method: 'cash' | 'card' | 'mobile_money';
  transaction_id?: string;
}

export interface Business {
  id?: number;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  logo_url?: string;
  currency_code?: string;
  country?: string;
  country_code?: string;
}

// Inventory Types
export interface InventoryHistory {
  id: number;
  product_id: number;
  change_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reason?: string;
  changed_by: number;
  changed_at: string;
  product_name?: string;
  business_inventory_number?: number;
  business_id?: number;
}

export interface InventoryAdjustment {
  product_id: number;
  quantity_change: number;
  reason?: string;
}

// MISSING TYPES ADDED
export interface LowStockAlert {
  product_id: number;
  product_name: string;
  current_stock: number;
  min_stock_level: number;
}

export interface StockLevel {
  product_id: number;
  product_name: string;
  current_stock: number;
  min_stock_level: number;
  needs_restock: boolean;
}

// Report Types - UPDATED FOR DUAL CURRENCY
export interface SalesSummary {
  total_sales: number;
  total_sales_original: number;
  total_tax: number;
  total_transactions: number;
  average_transaction_value: number;
  payment_methods: Record<string, number>;
  primary_currency: string;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
  total_revenue_original: number;
  profit_margin: number;
}

export interface SalesTrend {
  date: string;
  daily_sales: number;
  daily_sales_original: number;
  transactions: number;
  average_order_value: number;
}

export interface SalesReport {
  summary: SalesSummary;
  top_products: TopProduct[];
  sales_trends: SalesTrend[];
  date_range: {
    start_date: string;
    end_date: string;
  };
}

// MISSING REPORT TYPES ADDED
export interface InventoryReport {
  // Define based on your backend needs
  summary: any;
  low_stock_items: LowStockAlert[];
}

export interface FinancialReport {
  // Define based on your backend needs
  revenue: number;
  expenses: number;
  profit: number;
}

//export interface ReportFormat {
  //format: 'pdf' | 'excel' | 'csv';
//}

// Additional Report and Dashboard Types
export interface DashboardMetrics {
  sales_today: SalesSummary;
  inventory_alerts: number;
  weekly_financial: {
    total_revenue: number;
    cogs: number;
    gross_profit: number;
    gross_margin: number;
    tax_collected: number;
    net_profit: number;
    total_revenue_original?: number;
    exchange_rate?: number;
  };
  timestamp: string;
}

// Customer Types
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyalty_points: number;
  total_spent: number;
  created_at: string;
  last_purchase?: string;
}

export interface CustomerCreate {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CustomerUpdate {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Activity Types
export interface Activity {
  id: number;
  type: 'sale' | 'inventory' | 'expense' | 'user' | 'system';
  description: string;
  amount?: number;
  currency_code?: string;
  exchange_rate?: number;
  usd_amount?: number;
  product_id?: number;
  user_id?: number;
  username?: string;
  timestamp: string;
  created_at: string;
}

export interface CustomerPurchaseHistory {
  sale_id: number;
  total_amount: number;
  created_at: string;
  items: string[];
}

// Refund Types - CORRECTED TO MATCH BACKEND
export interface RefundItem {
  id: number;
  sale_item_id: number;
  quantity: number;
  refund_id: number;
}

export interface Refund {
  id: number;
  sale_id: number;
  user_id: number;
  business_id: number;
  business_refund_number: number;
  reason: string | null;
  total_amount: number;
  
  // MISSING PROPERTIES ADDED
  original_amount: number;
  original_currency: string;
  exchange_rate_at_refund: number;
  
  status: string;
  created_at: string;
  refund_items: RefundItem[];
}

export interface RefundCreate {
  sale_id: number;
  reason?: string;
  refund_items: RefundItemCreate[];
}

export interface RefundItemCreate {
  sale_item_id: number;
  quantity: number;
}

// Supplier Types
export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierCreate {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
}

export interface PurchaseOrderItem {
  id: number;
  po_id: number;
  product_id: number;
  quantity: number;
  unit_cost: number;
  received_quantity: number;
  notes?: string;
  product_name?: string;
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  po_number: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  total_amount: number;
  order_date: string;
  expected_delivery?: string;
  received_date?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  items: PurchaseOrderItem[];
  supplier_name?: string;
}

export interface PurchaseOrderCreate {
  supplier_id: number;
  expected_delivery?: string;
  notes?: string;
  items: PurchaseOrderItemCreate[];
}

export interface PurchaseOrderItemCreate {
  product_id: number;
  quantity: number;
  unit_cost: number;
  notes?: string;
}

// Currency types
export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  symbol_position: 'before' | 'after' | 'space_before' | 'space_after';
  is_active: boolean;
  created_at: string;
}

export interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  effective_date: string;
  source: string;
}

export interface BusinessCurrencyUpdate {
  currency_code: string;
}

export interface CurrencyConversion {
  original_amount: number;
  from_currency: string;
  to_currency: string;
  converted_amount: number;
}

// Expense Types - CORRECTED TO MATCH BACKEND
export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Expense {
  id: number;
  amount: number;
  
  // MISSING PROPERTIES ADDED
  original_amount: number;
  original_currency_code: string;
  exchange_rate: number;
  
  description: string;
  category_id: number;
  business_id: number;
  payment_method: string;
  is_recurring: boolean;
  recurrence_interval?: string;
  date: string;
  created_by: number;
  receipt_url?: string;
  category?: ExpenseCategory;
}

export interface ExpenseCreate {
  amount: number;
  currency_code: string;
  description: string;
  category_id: number;
  business_id: number;
  payment_method?: string;
  is_recurring?: boolean;
  recurrence_interval?: string;
  receipt_url?: string;
  
  // MISSING PROPERTIES ADDED
  original_amount: number;
  original_currency_code: string;
}

export interface ExpenseCategoryCreate {
  name: string;
  description?: string;
}

// MISSING TYPES FOR SERVICES
export interface BusinessCreate {
  name: string;
  currency_code: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  tax_id?: string;
  country?: string;
  country_code?: string;
}

// Barcode scanning types
export interface BarcodeScanResult {
  code: string;
  format: string;
  timestamp: number;
}

export interface BarcodeLookupResult {
  product?: Product;
  exists: boolean;
  message: string;
}

export interface BusinessCreate {
  name: string;
  currency_code: string;
  timezone?: string;
}

export interface BusinessUpdate extends Partial<BusinessCreate> {
  id: number;
}
