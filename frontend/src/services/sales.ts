import { api } from './api';
import { Sale, SaleCreate, SaleSummary } from '../types';

export const salesService = {
  // Get list of all sales
  getSales: async (): Promise<Sale[]> => {
    const response = await api.get<Sale[]>('/api/sales/');
    return response.data;
  },

  // Get a specific sale by ID
  getSale: async (id: number): Promise<Sale> => {
    const response = await api.get<Sale>(`/api/sales/${id}`);
    return response.data;
  },

  // Get sale with products details if needed
  getSaleWithProducts: async (id: number): Promise<Sale> => {
    const response = await api.get<Sale>(`/api/sales/${id}`);
    return response.data;
  },

  // Create new sale (inventory is automatically updated by backend)
  createSale: async (saleData: SaleCreate): Promise<Sale> => {
    const response = await api.post<Sale>('/api/sales/', saleData);
    return response.data;
  },

  // Additional methods can be added here if needed
};
