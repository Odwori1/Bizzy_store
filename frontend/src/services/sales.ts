import { api } from './api';
import { Sale, SaleCreate, SaleSummary } from '../types';
import { inventoryService } from './inventory';

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

  // Create new sale and update inventory accordingly
  createSale: async (saleData: SaleCreate): Promise<Sale> => {
    const response = await api.post<Sale>('/api/sales/', saleData);
    const sale = response.data;
    
    // Automatically update inventory for each sold item
    try {
      for (const item of saleData.sale_items) {
        await inventoryService.adjustInventory({
          product_id: item.product_id,
          quantity_change: -item.quantity, // Negative for sales
          reason: `Sale #${sale.id}`
        });
      }
    } catch (error) {
      console.error('Failed to update inventory after sale:', error);
      // Don't throw error - sale was successful, just inventory update failed
      // This could be enhanced with retry logic or error reporting
    }
    
    return sale;
  },

  // Additional methods can be added here if needed
};
