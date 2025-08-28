import { api } from './api';
import { 
  InventoryHistory, 
  InventoryAdjustment, 
  LowStockAlert, 
  StockLevel 
} from '../types';

export const inventoryService = {
  // Get inventory history
  getInventoryHistory: async (productId?: number, skip: number = 0, limit: number = 100): Promise<InventoryHistory[]> => {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (productId) params.append('product_id', productId.toString());
    
    const response = await api.get<InventoryHistory[]>(`/api/inventory/history?${params}`);
    return response.data;
  },

  // Adjust inventory quantity
  adjustInventory: async (adjustment: InventoryAdjustment): Promise<StockLevel> => {
    const response = await api.post<StockLevel>('/api/inventory/adjust', adjustment);
    return response.data;
  },

  // Get low stock alerts
  getLowStockAlerts: async (threshold?: number): Promise<LowStockAlert[]> => {
    const params = new URLSearchParams();
    if (threshold) params.append('threshold', threshold.toString());
    
    const response = await api.get<LowStockAlert[]>(`/api/inventory/low-stock?${params}`);
    return response.data;
  },

  // Get current stock levels
  getStockLevels: async (skip: number = 0, limit: number = 100): Promise<StockLevel[]> => {
    const response = await api.get<StockLevel[]>(`/api/inventory/stock-levels?skip=${skip}&limit=${limit}`);
    return response.data;
  }
};
