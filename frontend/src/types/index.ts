// User Types - UPDATED FOR RBAC
export interface User {
  id: number;
  email: string;
  username: string;
  // REMOVED: role: 'admin' | 'manager' | 'cashier';
  // ADDED: The new permissions array from the backend
  permissions: string[];
  is_active: boolean;
  created_at: string;
  role_name?: string;
}

// UPDATED: The backend likely now expects a role_name or role_id on creation, not a hardcoded string.
// We need to check the backend schema for the correct field name.
// This is a placeholder. The correct structure might be:
// export interface UserCreate {
//   email: string;
//   username: string;
//   password: string;
//   role_name: string; // or role_id: number;
// }
// For now, we'll keep it simple until we confirm the create endpoint.
export interface UserCreate {
  email: string;
  username: string;
  password: string;
  role: string; // This will likely need to change based on backend API
}

// Product Types
export interface Product {
  id: number
  name: string
  description?: string
  price: number
  barcode: string
  stock_quantity: number
  min_stock_level: number
  created_at: string
  updated_at?: string
  last_restocked?: string
}

export interface ProductCreate {
  name: string
  description?: string
  price: number
  barcode: string
  stock_quantity: number
  min_stock_level: number
}

// POS Cart Types
export interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
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

// Sale Types
export interface Sale {
  id: number
  user_id: number
  total_amount: number
  tax_amount: number
  payment_status: 'pending' | 'completed' | 'refunded'
  created_at: string
  sale_items: SaleItem[]
  payments: Payment[]
  user_name?: string
  refunds?: Refund[]; // Add optional refunds array
}

export interface SaleItem {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  subtotal: number
  product_name?: string
}

export interface Payment {
  id: number
  amount: number
  payment_method: 'cash' | 'card' | 'mobile_money'
  transaction_id?: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export interface SaleCreate {
  user_id: number
  sale_items: SaleItemCreate[]
  payments: PaymentCreate[]
  tax_rate: number
}

export interface SaleItemCreate {
  product_id: number
  quantity: number
  unit_price: number
}

export interface PaymentCreate {
  amount: number
  payment_method: 'cash' | 'card' | 'mobile_money'
  transaction_id?: string
}

export interface Business {
  id?: number;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  logo_url?: string;
  currency_code?: string; // NEW
  country?: string; // NEW
  country_code?: string; // NEW
}

// Inventory Types
export interface InventoryHistory {
  id: number
  product_id: number
  change_type: string
  quantity_change: number
  previous_quantity: number
  new_quantity: number
  reason?: string
  changed_by: number
  changed_at: string
  product_name?: string
}

export interface InventoryAdjustment {
  product_id: number
  quantity_change: number
  reason?: string
}

// Report Types
export interface SalesReport {
  summary: {
    total_sales: number
    total_tax: number
    total_transactions: number
    average_transaction_value: number
    payment_methods: Record<string, number>
  }
  top_products: Array<{
    product_id: number
    product_name: string
    quantity_sold: number
    total_revenue: number
    profit_margin: number
  }>
  sales_trends: Array<{
    date: string
    daily_sales: number
    transactions: number
    average_order_value: number
  }>
  date_range: {
    start_date: string
    end_date: string
  }
}

// Additional Report and Dashboard Types (Merged in)
export interface SalesSummary {
  total_sales: number;
  total_tax: number;
  total_transactions: number;
  average_transaction_value: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
  profit_margin: number;
}

export interface SalesTrend {
  date: string;
  daily_sales: number;
  transactions: number;
  average_order_value: number;
}

export interface DateRange {
  start_date: string;
  end_date: string;
}

// Ensure these interfaces exist and match the backend
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
  };
  timestamp: string;
}

// Add to existing types...

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

export interface CustomerPurchaseHistory {
  sale_id: number;
  total_amount: number;
  created_at: string;
  items: string[];
}

// ... existing types ...

// Refund Types
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
  reason: string | null;
  total_amount: number;
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

// Add to existing types...

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

// Add Currency types (add this anywhere in the file)
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

// Add to existing types...

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Expense {
  id: number;
  amount: number;
  currency_code: string;
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
}

export interface ExpenseCategoryCreate {
  name: string;
  description?: string;
}
