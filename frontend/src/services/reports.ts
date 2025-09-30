import { api } from './api';
import { SalesReport, DashboardMetrics, InventoryReport, FinancialReport } from '../types';
import { ReportFormat } from '../types/reports';
import { SalesTrend, TopProduct } from '../hooks/useReports';

// Interface for backend response (different from frontend)
interface BackendSalesTrend {
  date: string;
  daily_sales: number;
  daily_sales_original: number;
  transactions: number;
  average_order_value: number;
}

// Sales report
export const reportsService = {
  getSalesReport: async (startDate?: string, endDate?: string): Promise<SalesReport> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get<SalesReport>(`/api/reports/sales?${params}`);
    return response.data;
  },

  // Dashboard metrics
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.get<DashboardMetrics>('/api/reports/dashboard');
    return response.data;
  },

  // Inventory report
  getInventoryReport: async (): Promise<InventoryReport> => {
    const response = await api.get<InventoryReport>('/api/reports/inventory');
    return response.data;
  },

  // Financial report
  getFinancialReport: async (startDate?: string, endDate?: string): Promise<FinancialReport> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get<FinancialReport>(`/api/reports/financial?${params}`);
    return response.data;
  },

  // Export functions
  exportSalesToExcel: async (startDate?: string, endDate?: string): Promise<Blob> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('format', 'excel');

    const response = await api.get(`/api/reports/sales?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  exportSalesToCSV: async (startDate?: string, endDate?: string): Promise<Blob> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('format', 'csv');

    const response = await api.get(`/api/reports/sales?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  exportInventoryToExcel: async (): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('format', 'excel');

    const response = await api.get(`/api/reports/inventory?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Sales trends report - FIXED: Transform backend data to frontend format
  getSalesTrends: async (startDate?: string, endDate?: string): Promise<SalesTrend[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get<BackendSalesTrend[]>(`/api/reports/sales/trends?${params}`);
    
    // Transform backend data to frontend format
    return response.data.map(item => ({
      date: item.date,
      sales: item.daily_sales,      // Transform daily_sales → sales
      transactions: item.transactions,
    }));
  },

  // Top products report - CORRECT ENDPOINT
  getTopProducts: async (startDate?: string, endDate?: string): Promise<TopProduct[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get<TopProduct[]>(`/api/reports/products/top?${params}`);
    return response.data;
  },

  // Analytics - Daily scan statistics
  getDailyScanStats: async (): Promise<{ success: boolean; data: Array<{ date: string; scan_count: number }> }> => {
    const response = await api.get<{ success: boolean; data: Array<{ date: string; scan_count: number }> }>('/api/analytics/daily-scans');
    return response.data;
  },

  // Analytics - User activity statistics
  getUserActivityStats: async (): Promise<{ success: boolean; data: Array<{ user_id: number; username: string; scan_count: number }> }> => {
    const response = await api.get<{ success: boolean; data: Array<{ user_id: number; username: string; scan_count: number }> }>('/api/analytics/user-activity');
    return response.data;
  },
};
