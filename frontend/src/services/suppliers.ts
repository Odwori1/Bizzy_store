import { api } from './api';
import { Supplier, SupplierCreate, PurchaseOrder, PurchaseOrderCreate } from '../types';

export const suppliersService = {
  // Suppliers
  getSuppliers: async (skip: number = 0, limit: number = 100): Promise<Supplier[]> => {
    const response = await api.get<Supplier[]>(`/api/suppliers?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getSupplier: async (id: number): Promise<Supplier> => {
    const response = await api.get<Supplier>(`/api/suppliers/${id}`);
    return response.data;
  },

  getSupplierPurchaseOrders: async (supplierId: number, skip: number = 0, limit: number = 100): Promise<PurchaseOrder[]> => {
    console.log(`API Call: GET /api/suppliers/${supplierId}/purchase-orders`);
    try {
      const response = await api.get<PurchaseOrder[]>(`/api/suppliers/${supplierId}/purchase-orders?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createSupplier: async (supplier: SupplierCreate): Promise<Supplier> => {
    const response = await api.post<Supplier>('/api/suppliers/', supplier);
    return response.data;
  },

  updateSupplier: async (id: number, supplier: Partial<SupplierCreate>): Promise<Supplier> => {
    const response = await api.put<Supplier>(`/api/suppliers/${id}`, supplier);
    return response.data;
  },

  deleteSupplier: async (id: number): Promise<void> => {
    await api.delete(`/api/suppliers/${id}`);
  },

  // Purchase Orders
  getPurchaseOrders: async (skip: number = 0, limit: number = 100): Promise<PurchaseOrder[]> => {
    try {
      const response = await api.get<PurchaseOrder[]>(`/api/suppliers/purchase-orders?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
    }
  },

  getPurchaseOrder: async (id: number): Promise<PurchaseOrder> => {
    const response = await api.get<PurchaseOrder>(`/api/suppliers/purchase-orders/${id}`);
    return response.data;
  },

  createPurchaseOrder: async (po: PurchaseOrderCreate): Promise<PurchaseOrder> => {
    console.log("Creating PO with data:", po);
      const response = await api.post<PurchaseOrder>('/api/suppliers/purchase-orders/', po);
      console.log("Create PO response:", response);
    return response.data;
  },

  updatePoStatus: async (id: number, status: string): Promise<PurchaseOrder> => {
    const response = await api.patch<PurchaseOrder>(`/api/suppliers/purchase-orders/${id}/status?new_status=${status}`);
    return response.data;
  },

  receivePoItems: async (id: number, items: Array<{ item_id: number; quantity: number }>): Promise<PurchaseOrder> => {
    const response = await api.post<PurchaseOrder>(`/api/suppliers/purchase-orders/${id}/receive`, items);
    return response.data;
}
};
