import { api } from './api';
import { Customer, CustomerCreate, CustomerUpdate, CustomerPurchaseHistory } from '../types';

export const customersService = {
  // Get all customers
  getCustomers: async (search?: string): Promise<Customer[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    const response = await api.get<Customer[]>(`/api/customers/?${params}`);
    return response.data;
  },

  // Get customer by ID
  getCustomer: async (id: number): Promise<Customer> => {
    const response = await api.get<Customer>(`/api/customers/${id}`);
    return response.data;
  },

  // Create new customer
  createCustomer: async (customerData: CustomerCreate): Promise<Customer> => {
    const response = await api.post<Customer>('/api/customers/', customerData);
    return response.data;
  },

  // Update customer
  updateCustomer: async (id: number, customerData: CustomerUpdate): Promise<Customer> => {
    const response = await api.put<Customer>(`/api/customers/${id}`, customerData);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id: number): Promise<void> => {
    await api.delete(`/api/customers/${id}`);
  },

  // Get customer purchase history
  getCustomerPurchaseHistory: async (id: number): Promise<CustomerPurchaseHistory[]> => {
    const response = await api.get<CustomerPurchaseHistory[]>(`/api/customers/${id}/purchase-history`);
    return response.data;
  },

  // Search customers
  searchCustomers: async (query: string): Promise<Customer[]> => {
    const response = await api.get<Customer[]>(`/api/customers/?search=${encodeURIComponent(query)}`);
    return response.data;
  }
};
