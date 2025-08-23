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

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  console.log('API Request Interceptor - Token found:', !!token); // ADD FOR DEBUG
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Authorization header set:', config.headers.Authorization); // ADD FOR DEBUG
  }
  return config;
});
