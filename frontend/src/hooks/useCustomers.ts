import { create } from 'zustand';
import { customersService } from '../services/customers';
import { Customer, CustomerCreate, CustomerUpdate, CustomerPurchaseHistory } from '../types';

interface CustomersState {
  // State
  customers: Customer[];
  currentCustomer: Customer | null;
  purchaseHistory: CustomerPurchaseHistory[];
  loading: boolean;
  error: string | null;

  // Actions
  loadCustomers: (search?: string) => Promise<void>;
  loadCustomer: (id: number) => Promise<void>;
  createCustomer: (customerData: CustomerCreate) => Promise<Customer>;
  updateCustomer: (id: number, customerData: CustomerUpdate) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  loadPurchaseHistory: (id: number) => Promise<void>;
  searchCustomers: (query: string) => Promise<Customer[]>;
  clearError: () => void;
  clearCurrentCustomer: () => void;
}

export const useCustomers = create<CustomersState>((set, get) => ({
  // Initial state
  customers: [],
  currentCustomer: null,
  purchaseHistory: [],
  loading: false,
  error: null,

  // Load all customers
  loadCustomers: async (search?: string) => {
    set({ loading: true, error: null });
    try {
      const customers = await customersService.getCustomers(search);
      set({ customers, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to load customers', loading: false });
    }
  },

  // Load specific customer
  loadCustomer: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const customer = await customersService.getCustomer(id);
      set({ currentCustomer: customer, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to load customer', loading: false });
    }
  },

  // Create new customer
  createCustomer: async (customerData: CustomerCreate) => {
    set({ loading: true, error: null });
    try {
      const newCustomer = await customersService.createCustomer(customerData);
      const { customers } = get();
      set({ customers: [...customers, newCustomer], loading: false });
      return newCustomer;
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to create customer', loading: false });
      throw error;
    }
  },

  // Update customer
  updateCustomer: async (id: number, customerData: CustomerUpdate) => {
    set({ loading: true, error: null });
    try {
      const updatedCustomer = await customersService.updateCustomer(id, customerData);
      const { customers, currentCustomer } = get();
      
      const updatedCustomers = customers.map(customer =>
        customer.id === id ? updatedCustomer : customer
      );
      
      set({
        customers: updatedCustomers,
        currentCustomer: currentCustomer?.id === id ? updatedCustomer : currentCustomer,
        loading: false
      });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to update customer', loading: false });
      throw error;
    }
  },

  // Delete customer
  deleteCustomer: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await customersService.deleteCustomer(id);
      const { customers, currentCustomer } = get();
      
      set({
        customers: customers.filter(customer => customer.id !== id),
        currentCustomer: currentCustomer?.id === id ? null : currentCustomer,
        loading: false
      });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to delete customer', loading: false });
      throw error;
    }
  },

  // Load purchase history
  loadPurchaseHistory: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const history = await customersService.getCustomerPurchaseHistory(id);
      set({ purchaseHistory: history, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to load purchase history', loading: false });
    }
  },

  // Search customers
  searchCustomers: async (query: string) => {
    try {
      return await customersService.searchCustomers(query);
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to search customers' });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Clear current customer
  clearCurrentCustomer: () => set({ currentCustomer: null, purchaseHistory: [] }),
}));
