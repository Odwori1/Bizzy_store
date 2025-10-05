import { create } from 'zustand';
import { User, UserCreate } from '../types';
import { userService } from '../services/users';

interface UsersState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  selectedUser: User | null;

  // Actions
  fetchUsers: () => Promise<void>;
  createUser: (userData: UserCreate) => Promise<void>;
  updateUser: (id: number, userData: UserCreate) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  toggleUserStatus: (id: number) => Promise<void>; // ✅ ADD THIS LINE
  setSelectedUser: (user: User | null) => void;
  clearError: () => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  selectedUser: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const users = await userService.getUsers();
      set({ users, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to fetch users', isLoading: false });
    }
  },

  createUser: async (userData: UserCreate) => {
    set({ isLoading: true, error: null });
    try {
      const newUser = await userService.createUser(userData);
      // Add the new user to the local state
      set(state => ({
        users: [...state.users, newUser],
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to create user', isLoading: false });
      throw error; // Re-throw to handle in the UI component
    }
  },

  updateUser: async (id: number, userData: UserCreate) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await userService.updateUser(id, userData);
      // Update the user in the local state
      set(state => ({
        users: state.users.map(user => user.id === id ? updatedUser : user),
        isLoading: false,
        selectedUser: null // Close the edit modal after update
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to update user', isLoading: false });
      throw error;
    }
  },

  deleteUser: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await userService.deleteUser(id);
      // Remove the user from the local state
      set(state => ({
        users: state.users.filter(user => user.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to delete user', isLoading: false });
      throw error;
    }
  },

  toggleUserStatus: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await userService.toggleUserStatus(id);
      // Update the user in the local state
      set(state => ({
        users: state.users.map(user => user.id === id ? updatedUser : user),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Failed to toggle user status', isLoading: false });
      throw error;
    }
  },

  setSelectedUser: (user: User | null) => set({ selectedUser: user }),
  clearError: () => set({ error: null }),
}));
