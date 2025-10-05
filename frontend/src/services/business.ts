import { api } from './api';
import { Business, BusinessCreate } from '../types';

export const businessService = {
  // Get business for current user - ADD TRAILING SLASH
  getBusiness: async (): Promise<Business> => {
    const response = await api.get<Business>('/api/business/'); // ADD SLASH
    return response.data;
  },

  // Create or update business - ADD TRAILING SLASH
  updateBusiness: async (businessData: BusinessCreate): Promise<Business> => {
    const response = await api.post<Business>('/api/business/', businessData); // ADD SLASH
    return response.data;
  }
};
