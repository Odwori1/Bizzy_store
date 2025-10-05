import { create } from 'zustand';
import { inventoryService } from '../services/inventory';
import { InventoryHistory, LowStockAlert, StockLevel, InventoryAdjustment } from '../types';

interface InventoryState {
  // State
  stockLevels: StockLevel[];
  lowStockAlerts: LowStockAlert[];
  inventoryHistory: InventoryHistory[];
  loading: boolean;
  error: string | null;

  // Actions
  loadStockLevels: () => Promise<void>;
  loadLowStockAlerts: () => Promise<void>;
  loadInventoryHistory: (productId?: number) => Promise<void>;
  adjustInventory: (adjustment: InventoryAdjustment) => Promise<StockLevel>;
  clearError: () => void;
}

export const useInventory = create<InventoryState>((set, get) => ({
  // Initial state
  stockLevels: [],
  lowStockAlerts: [],
  inventoryHistory: [],
  loading: false,
  error: null,

  // Load stock levels
  loadStockLevels: async () => {
    set({ loading: true, error: null });
    try {
      const stockLevels = await inventoryService.getStockLevels();
      set({ stockLevels, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to load stock levels', loading: false });
    }
  },

  // Load low stock alerts
  loadLowStockAlerts: async () => {
    set({ loading: true, error: null });
    try {
      const lowStockAlerts = await inventoryService.getLowStockAlerts();
      set({ lowStockAlerts, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to load low stock alerts', loading: false });
    }
  },

  // Load inventory history
  loadInventoryHistory: async (productId?: number) => {
    set({ loading: true, error: null });
    try {
      const inventoryHistory = await inventoryService.getInventoryHistory(productId);
      set({ inventoryHistory, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to load inventory history', loading: false });
    }
  },

  // Adjust inventory
  adjustInventory: async (adjustment: InventoryAdjustment) => {
    set({ loading: true, error: null });
    try {
      const result = await inventoryService.adjustInventory(adjustment);
      
      // Update local state
      const { stockLevels } = get();
      const updatedStockLevels = stockLevels.map(item =>
        item.product_id === result.product_id ? result : item
      );
      
      set({ stockLevels: updatedStockLevels, loading: false });
      return result;
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to adjust inventory', loading: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null })
}));
