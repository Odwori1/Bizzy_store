import { api } from './api';
import { SalesReport, DashboardMetrics, InventoryReport, FinancialReport, ReportFormat } from '../types';

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

  // Sales trends report
  getSalesTrends: async (startDate?: string, endDate?: string): Promise<SalesTrend[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get<SalesTrend[]>(`/api/reports/sales/trends?${params}`);
    return response.data;
  },

  // Top products report
  getTopProducts: async (startDate?: string, endDate?: string): Promise<TopProduct[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get<TopProduct[]>(`/api/reports/products/top?${params}`);
    return response.data;
  }
};
