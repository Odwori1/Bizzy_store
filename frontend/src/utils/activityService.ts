import axios from 'axios';

// Create a standalone axios instance for activities to avoid circular imports
const activityApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors
activityApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

activityApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const standaloneActivityService = {
  getRecentActivities: async (hours: number = 24, limit: number = 10) => {
    try {
      const response = await activityApi.get(`/api/activity/recent?hours=${hours}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      throw error;
    }
  },
};
