import { api } from './api';
import { Product, SaleCreate, Sale } from '../types';

// Product-related API calls
export const productService = {
  getProducts: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/api/products/');
    return response.data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/api/products/${id}`);
    return response.data;
  },
};

// Sale-related API calls
export const saleService = {
  createSale: async (saleData: SaleCreate): Promise<Sale> => {
    const response = await api.post<Sale>('/api/sales/', saleData);
    return response.data;
  },

  getSales: async (): Promise<Sale[]> => {
    const response = await api.get<Sale[]>('/api/sales/');
    return response.data;
  },

  getSale: async (id: number): Promise<Sale> => {
    const response = await api.get<Sale>(`/api/sales/${id}`);
    return response.data;
  },

  getSaleWithProducts: async (id: number): Promise<Sale> => {
    const response = await api.get<Sale>(`/api/sales/${id}`);
    return response.data;
  },
};
