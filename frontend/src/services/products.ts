import { api } from './api';
import { Product, ProductCreate } from '../types';


export const productService = {
  // Get all products
  getProducts: async (skip: number = 0, limit: number = 100): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/api/products/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Get single product by ID
  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/api/products/${id}`);
    return response.data;
  },

  // Get product by barcode
  getProductByBarcode: async (barcode: string): Promise<Product | null> => {
    try {
      const response = await api.get<Product>(`/api/products/barcode/${barcode}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Create new product
  createProduct: async (productData: ProductCreate): Promise<Product> => {
    const response = await api.post<Product>('/api/products/', productData);
    return response.data;
  },

  // Update existing product
  updateProduct: async (id: number, productData: ProductCreate): Promise<Product> => {
    const response = await api.put<Product>(`/api/products/${id}`, productData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/api/products/${id}`);
  },

  // Search products (if backend supports it)
  searchProducts: async (query: string): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/api/products/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};
