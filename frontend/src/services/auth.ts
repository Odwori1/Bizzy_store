import { api } from './api'

export interface LoginCredentials {
  identifier: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

// NEW: Response for when 2FA is required
export interface TwoFactorRequiredResponse {
  requires_2fa: boolean
  message: string
  temp_token: string
}

// NEW: Create a union type for the login response
export type LoginResponse = AuthResponse | TwoFactorRequiredResponse;

export const authService = {
  // CHANGED: Function now returns the union type and does NOT automatically store the token
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/token', credentials);
    // NEW: Check the response before storing a token
    if ('access_token' in response.data) {
      // This is a normal login without 2FA
      localStorage.setItem('auth_token', response.data.access_token);
    }
    // If it's a 2FA response, we don't store anything and let the component handle it
    return response.data;
  },

  // NEW: Function to complete login after 2FA verification
  verify2FA: async (tempToken: string, code: string): Promise<AuthResponse> => {
    // This endpoint needs to be created in the backend next
    const response = await api.post<AuthResponse>('/api/auth/verify-2fa', {
      temp_token: tempToken,
      code: code
    });
    localStorage.setItem('auth_token', response.data.access_token);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  requestPasswordReset: async (email: string): Promise<{ msg: string }> => {
    const response = await api.post<{ msg: string }>('/api/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ msg: string }> => {
    const response = await api.post<{ msg: string }>('/api/auth/reset-password', {
      token,
      new_password: newPassword
    });
    return response.data;
  }
};
