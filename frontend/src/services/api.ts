import axios from 'axios';

// Fix: Add type declaration for import.meta.env
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_API_URL?: string;
    };
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple function to get token without circular dependencies
const getToken = (): string | null => {
  return localStorage.getItem('access_token') || localStorage.getItem('auth_token');
};

// Simple function to logout without circular dependencies
const logout = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_data');
};

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = getToken();
  console.log('API Request Interceptor - Token found:', !!token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Authorization header set:', config.headers.Authorization);
  }
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
