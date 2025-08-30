import { create } from 'zustand';
import { suppliersService } from '../services/suppliers';
import { Supplier, SupplierCreate, PurchaseOrder, PurchaseOrderCreate } from '../types';

interface SuppliersState {
  // State
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  selectedSupplier?: Supplier;
  selectedPurchaseOrder?: PurchaseOrder;
  loading: boolean;
  error: string | null;

  // Actions
  loadSuppliers: () => Promise<void>;
  loadSupplier: (id: number) => Promise<void>;
  createSupplier: (supplier: SupplierCreate) => Promise<Supplier>;
  updateSupplier: (id: number, supplier: Partial<SupplierCreate>) => Promise<Supplier>;
  deleteSupplier: (id: number) => Promise<void>;

  loadPurchaseOrders: () => Promise<void>;
  loadPurchaseOrder: (id: number) => Promise<void>;
  createPurchaseOrder: (po: PurchaseOrderCreate) => Promise<PurchaseOrder>;
  updatePoStatus: (id: number, status: string) => Promise<PurchaseOrder>;
  receivePoItems: (id: number, items: Array<{ item_id: number; quantity: number }>) => Promise<PurchaseOrder>;

  clearError: () => void;
  clearSelection: () => void;
}

export const useSuppliers = create<SuppliersState>((set, get) => ({
  // Initial state
  suppliers: [],
  purchaseOrders: [],
  selectedSupplier: undefined,
  selectedPurchaseOrder: undefined,
  loading: false,
  error: null,

  // Load suppliers
  loadSuppliers: async () => {
    set({ loading: true, error: null });
    try {
      const suppliers = await suppliersService.getSuppliers();
      set({ suppliers, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.[0]?.msg || error.response?.data?.detail || "Failed to load suppliers", loading: false });
    }
  },

  // Load single supplier
  loadSupplier: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const supplier = await suppliersService.getSupplier(id);
      set({ selectedSupplier: supplier, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.[0]?.msg || error.response?.data?.detail || "Failed to load supplier", loading: false });
    }
  },

  // Create supplier
  createSupplier: async (supplier: SupplierCreate) => {
    set({ loading: true, error: null });
    try {
      const newSupplier = await suppliersService.createSupplier(supplier);
      const { suppliers } = get();
      set({ suppliers: [...suppliers, newSupplier], loading: false });
      return newSupplier;
    } catch (error: any) {
      set({ error: error.response?.data?.[0]?.msg || error.response?.data?.detail || "Failed to create supplier", loading: false });
      throw error;
    }
  },

  // Update supplier
  updateSupplier: async (id: number, supplier: Partial<SupplierCreate>) => {
    set({ loading: true, error: null });
    try {
      const updatedSupplier = await suppliersService.updateSupplier(id, supplier);
      const { suppliers } = get();
      const updatedSuppliers = suppliers.map(s => s.id === id ? updatedSupplier : s);
      set({ suppliers: updatedSuppliers, selectedSupplier: updatedSupplier, loading: false });
      return updatedSupplier;
    } catch (error: any) {
      set({ error: error.response?.data?.[0]?.msg || error.response?.data?.detail || "Failed to update supplier", loading: false });
      throw error;
    }
  },

  // Delete supplier
  deleteSupplier: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await suppliersService.deleteSupplier(id);
      const { suppliers } = get();
      const filteredSuppliers = suppliers.filter(s => s.id !== id);
      set({ suppliers: filteredSuppliers, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.[0]?.msg || error.response?.data?.detail || "Failed to delete supplier", loading: false });
      throw error;
    }
  },

  // Load purchase orders - Modified to handle supplier-specific endpoints
  loadPurchaseOrders: async () => {
    set({ loading: true, error: null });
    try {
      // First load suppliers
      const suppliers = await suppliersService.getSuppliers();
      
      // Then load purchase orders for each supplier
      const allPurchaseOrders: PurchaseOrder[] = [];
      
      for (const supplier of suppliers) {
        try {
          // This assumes the backend has an endpoint like /api/suppliers/{id}/purchase-orders
          const purchaseOrders = await suppliersService.getSupplierPurchaseOrders(supplier.id);
          allPurchaseOrders.push(...purchaseOrders);
        } catch (error) {
          console.warn(`Failed to load purchase orders for supplier ${supplier.id}:`, error);
          // Continue with other suppliers even if one fails
        }
      }
      
      set({ purchaseOrders: allPurchaseOrders, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.[0]?.msg || error.response?.data?.detail || "Failed to load purchase orders", loading: false });
    }
  },

  // Load single purchase order
  loadPurchaseOrder: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const purchaseOrder = await suppliersService.getPurchaseOrder(id);
      set({ selectedPurchaseOrder: purchaseOrder, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.[0]?.msg || error.response?.data?.detail || "Failed to load purchase order", loading: false });
    }
  },

  // Create purchase order
  createPurchaseOrder: async (po: PurchaseOrderCreate) => {
    set({ loading: true, error: null });
    try {
      const newPO = await suppliersService.createPurchaseOrder(po);
      const { purchaseOrders } = get();
      set({ purchaseOrders: [...purchaseOrders, newPO], loading: false });
      return newPO;
    } catch (error: any) {
      set({ error: error.response?.data?.[0]?.msg || error.response?.data?.detail || "Failed to create purchase order", loading: false });
      throw error;
    }
  },

  // Update PO status
  updatePoStatus: async (id: number, status: string) => {
    set({ loading: true, error: null });
    try {
      const updatedPO = await suppliersService.updatePoStatus(id, status);
      const { purchaseOrders } = get();
      const updatedPOs = purchaseOrders.map(po => po.id === id ? updatedPO : po);
      set({ purchaseOrders: updatedPOs, selectedPurchaseOrder: updatedPO, loading: false });
      return updatedPO;
    } catch (error: any) {
      set({ error: error.response?.data?.[0]?.msg || error.response?.data?.detail || "Failed to update PO status", loading: false });
      throw error;
    }
  },

  // Receive PO items
  receivePoItems: async (id: number, items: Array<{ item_id: number; quantity: number }>) => {
    set({ loading: true, error: null });
    try {
      const updatedPO = await suppliersService.receivePoItems(id, items);
      const { purchaseOrders } = get();
      const updatedPOs = purchaseOrders.map(po => po.id === id ? updatedPO : po);
      set({ purchaseOrders: updatedPOs, selectedPurchaseOrder: updatedPO, loading: false });
      return updatedPO;
    } catch (error: any) {
      set({ error: error.response?.data?.[0]?.msg || error.response?.data?.detail || "Failed to receive items", loading: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Clear selection
  clearSelection: () => set({ selectedSupplier: undefined, selectedPurchaseOrder: undefined })
}));
