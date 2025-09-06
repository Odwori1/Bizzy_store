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

// 1. Create the api instance FIRST with the base URL.
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. NOW, define the helper functions that use the api instance.
// Simple function to get token
const getToken = (): string | null => {
  return localStorage.getItem('access_token') || localStorage.getItem('auth_token');
};

// Simple function to logout
const logout = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_data');
  // Redirect to login page
  window.location.href = '/login';
};

// 3. Add the request interceptor that uses the helpers
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 4. Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout(); // Handle unauthorized
    } else if (error.response?.status === 403) {
      console.error('Action forbidden: Missing permission.');
      // Consider displaying a user-friendly message here
    }
    return Promise.reject(error);
  }
);
