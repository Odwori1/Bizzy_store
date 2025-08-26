// User Types
export interface User {
  id: number
  email: string
  username: string
  role: 'admin' | 'manager' | 'cashier'  // <- ADD 'manager' HERE
  is_active: boolean
  created_at: string
}

export interface UserCreate {
  email: string
  username: string
  password: string
  role: 'admin' | 'manager' | 'cashier'  // <- ADD 'manager' HERE
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

export interface DashboardMetrics {
  sales_today: {
    total_sales: number
    total_tax: number
    total_transactions: number
    average_transaction_value: number
  }
  inventory_alerts: number
  weekly_financial: {
    total_revenue: number
    cogs: number
    gross_profit: number
    gross_margin: number
    tax_collected: number
    net_profit: number
  }
  timestamp: string
}
