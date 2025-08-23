import { api } from './api';
import { User } from '../types';

export const userService = {
  getCurrentUser: async (): Promise<User> => {
    // Use the new /api/users/me endpoint we just created
    const response = await api.get<User>('/api/users/me');
    return response.data;
  },

  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/api/users/');
    return response.data;
  },
};
