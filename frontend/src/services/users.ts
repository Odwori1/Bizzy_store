import { api } from './api';
import { User, UserCreate } from '../types';

export const userService = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/api/users/me');
    return response.data;
  },

  // ADMIN: Get all users
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/api/users/');
    return response.data;
  },

  // ADMIN: Get a specific user by ID
  getUserById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/api/users/${id}`);
    return response.data;
  },

  // ADMIN: Create a new user - ADD THIS FUNCTION
  createUser: async (userData: UserCreate): Promise<User> => {
    const response = await api.post<User>('/api/users/', userData);
    return response.data;
  },

  // ADMIN: Update a user
  updateUser: async (id: number, userData: UserCreate): Promise<User> => {
    const response = await api.put<User>(`/api/users/${id}`, userData);
    return response.data;
  },

  // ADMIN: Delete a user - ADD THIS FUNCTION
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },

  toggleUserStatus: async (id: number): Promise<User> => {
    const response = await api.patch<User>(`/api/users/${id}/status`);
    return response.data;
 },
};
