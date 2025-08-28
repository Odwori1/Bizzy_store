import { create } from 'zustand';
import { reportsService } from '../services/reports';
import { SalesReport, DashboardMetrics, InventoryReport, FinancialReport } from '../types';

interface ReportsState {
  // State
  salesReport: SalesReport | null;
  dashboardMetrics: DashboardMetrics | null;
  inventoryReport: InventoryReport | null;
  financialReport: FinancialReport | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadSalesReport: (startDate?: string, endDate?: string) => Promise<void>;
  loadDashboardMetrics: () => Promise<void>;
  loadInventoryReport: () => Promise<void>;
  loadFinancialReport: (startDate?: string, endDate?: string) => Promise<void>;
  clearError: () => void;
}

export const useReports = create<ReportsState>((set) => ({
  // Initial state
  salesReport: null,
  dashboardMetrics: null,
  inventoryReport: null,
  financialReport: null,
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

  // Clear error
  clearError: () => set({ error: null })
}));
