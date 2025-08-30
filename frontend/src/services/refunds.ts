import { api } from './api';
import { Refund, RefundCreate } from '../types';

export const refundsService = {
  // Create a new refund
  createRefund: async (refundData: RefundCreate): Promise<Refund> => {
    const response = await api.post<Refund>('/api/refunds/', refundData);
    return response.data;
  },

  // Get refunds for a specific sale
  getRefundsBySale: async (saleId: number): Promise<Refund[]> => {
    const response = await api.get<Refund[]>(`/api/refunds/sale/${saleId}`);
    return response.data;
  },

  // Get a specific refund by ID
  getRefund: async (refundId: number): Promise<Refund> => {
    const response = await api.get<Refund>(`/api/refunds/${refundId}`);
    return response.data;
  },

  // Get sale with refund details
  getSaleWithRefunds: async (saleId: number): Promise<any> => {
    const response = await api.get(`/api/sales/${saleId}/with-refunds`);
    return response.data;
  }
};
