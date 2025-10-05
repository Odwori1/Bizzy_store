import { api } from './api';
import { Sale, SaleCreate, PaymentCreate } from '../types';

export const posService = {
  // Create a new sale
  createSale: async (saleData: SaleCreate): Promise<Sale> => {
    const response = await api.post<Sale>('/api/sales/', saleData);
    return response.data;
  },

  // Get sale by ID
  getSale: async (saleId: number): Promise<Sale> => {
    const response = await api.get<Sale>(`/api/sales/${saleId}`);
    return response.data;
  },

  // Process payment
  processPayment: async (saleId: number, paymentData: PaymentCreate): Promise<any> => {
    const response = await api.post(`/api/sales/${saleId}/payments`, paymentData);
    return response.data;
  },

  // Void a sale
  voidSale: async (saleId: number): Promise<void> => {
    await api.post(`/api/sales/${saleId}/void`);
  },

  // Get today's sales
  getTodaySales: async (): Promise<Sale[]> => {
    const response = await api.get<Sale[]>('/api/sales/today');
    return response.data;
  }
};
