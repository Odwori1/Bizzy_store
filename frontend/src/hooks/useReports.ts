import { create } from 'zustand';
import { reportsService } from '../services/reports';
import { SalesReport, DashboardMetrics, InventoryReport, FinancialReport } from '../types';

// Add these interfaces at the top
export interface SalesTrend {
  date: string;
  sales: number;           // Frontend expects this
  transactions: number;
  //average_order_value: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
  profit_margin: number;
}

export interface ReportsState {
  // State
  salesReport: SalesReport | null;
  dashboardMetrics: DashboardMetrics | null;
  inventoryReport: InventoryReport | null;
  financialReport: FinancialReport | null;
  salesTrends: SalesTrend[];
  topProducts: TopProduct[];
  loading: boolean;
  error: string | null;

  // Actions
  loadSalesReport: (startDate?: string, endDate?: string) => Promise<void>;
  loadDashboardMetrics: () => Promise<void>;
  loadInventoryReport: () => Promise<void>;
  loadFinancialReport: (startDate?: string, endDate?: string) => Promise<void>;
  loadSalesTrends: (startDate?: string, endDate?: string) => Promise<void>;
  loadTopProducts: (startDate?: string, endDate?: string) => Promise<void>;
  clearError: () => void;
}

export const useReports = create<ReportsState>((set) => ({
  // Initial state
  salesReport: null,
  dashboardMetrics: null,
  inventoryReport: null,
  financialReport: null,
  salesTrends: [],
  topProducts: [],
  loading: false,
  error: null,

  // Load sales report
  loadSalesReport: async (startDate?: string, endDate?: string) => {
    set({ loading: true, error: null });
    try {
      const report = await reportsService.getSalesReport(startDate, endDate);
      set({ salesReport: report, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to load sales report', loading: false });
    }
  },

  // Load dashboard metrics
  loadDashboardMetrics: async () => {
    set({ loading: true, error: null });
    try {
      const metrics = await reportsService.getDashboardMetrics();
      set({ dashboardMetrics: metrics, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to load dashboard metrics', loading: false });
    }
  },

  // Load inventory report
  loadInventoryReport: async () => {
    set({ loading: true, error: null });
    try {
      const report = await reportsService.getInventoryReport();
      set({ inventoryReport: report, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to load inventory report', loading: false });
    }
  },

  // Load financial report
  loadFinancialReport: async (startDate?: string, endDate?: string) => {
    set({ loading: true, error: null });
    try {
      const report = await reportsService.getFinancialReport(startDate, endDate);
      set({ financialReport: report, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to load financial report', loading: false });
    }
  },

  // Load sales trends - FIXED: No mapping needed (service handles it)
  loadSalesTrends: async (startDate?: string, endDate?: string) => {
    try {
      const data = await reportsService.getSalesTrends(startDate, endDate);
      set({ salesTrends: data });  // Service already returns correct format
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to load sales trends' });
    }
  },

  // Load top products
  loadTopProducts: async (startDate?: string, endDate?: string) => {
    try {
      const data = await reportsService.getTopProducts(startDate, endDate);
      set({ topProducts: data.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity_sold: item.quantity_sold,
        total_revenue: item.total_revenue,
        profit_margin: item.profit_margin
      })) });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to load top products' });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
