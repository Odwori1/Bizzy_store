import { api } from './api'

export interface LoginCredentials {
  identifier: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

// Response for when 2FA is required
export interface TwoFactorRequiredResponse {
  requires_2fa: boolean
  message: string
  temp_token: string
}

// Create a union type for the login response
export type LoginResponse = AuthResponse | TwoFactorRequiredResponse;

export const authService = {
  // Function returns the union type
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    console.log('authService.login called with credentials:', credentials);
    try {
      const response = await api.post<LoginResponse>('/api/auth/token', credentials);
      console.log('authService.login response:', response.data);
      if ('access_token' in response.data) {
        // This is a normal login without 2FA
        localStorage.setItem('auth_token', response.data.access_token);
        console.log('Access token stored:', response.data.access_token);
      } else {
        console.log('2FA required:', response.data.requires_2fa);
      }
      return response.data;
    } catch (err) {
      console.error('Error during login:', err);
      throw err;
    }
  },

  // Function to complete login after 2FA verification
  verify2FA: async (tempToken: string, code: string): Promise<AuthResponse> => {
    console.log('authService.verify2FA called with tempToken:', tempToken, 'and code:', code);
    try {
      const response = await api.post<AuthResponse>('/api/auth/verify-2fa', {
        temp_token: tempToken,
        code: code
      });
      console.log('2FA verification response:', response.data);
      localStorage.setItem('auth_token', response.data.access_token);
      console.log('Access token stored after 2FA:', response.data.access_token);
      return response.data;
    } catch (err) {
      console.error('Error during 2FA verification:', err);
      throw err;
    }
  },

  logout: () => {
    console.log('authService.logout called');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    console.log('Tokens and user data removed from localStorage');
  },

  getToken: (): string | null => {
    // Try both keys for backward compatibility
    const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
    console.log('authService.getToken:', token);
    return token;
  },

  isAuthenticated: (): boolean => {
    const isAuth = !!localStorage.getItem('auth_token') || !!localStorage.getItem('access_token');
    console.log('authService.isAuthenticated:', isAuth);
    return isAuth;
  },

  requestPasswordReset: async (email: string): Promise<{ msg: string }> => {
    console.log('authService.requestPasswordReset called with email:', email);
    try {
      const response = await api.post<{ msg: string }>('/api/auth/forgot-password', { email });
      console.log('Password reset request response:', response.data);
      return response.data;
    } catch (err) {
      console.error('Error during password reset request:', err);
      throw err;
    }
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ msg: string }> => {
    console.log('authService.resetPassword called with token:', token);
    try {
      const response = await api.post<{ msg: string }>('/api/auth/reset-password', {
        token,
        new_password: newPassword
      });
      console.log('Password reset response:', response.data);
      return response.data;
    } catch (err) {
      console.error('Error during password reset:', err);
      throw err;
    }
  }
};
