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

// Interface for business registration
export interface BusinessRegistrationData {
  business_data: {
    name: string;
    currency_code: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
    tax_id?: string;
    country?: string;
    country_code?: string;
  };
  owner_data: {
    email: string;
    username: string;
    password: string;
  };
}

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

  // NEW: Token refresh method
  refreshToken: async (): Promise<void> => {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No token available');
    }
    
    try {
      // Simple token validation - in a real app, you might call a refresh endpoint
      // For now, we'll just validate the current token structure
      const response = await api.get('/api/auth/verify-token');
      console.log('Token refresh successful');
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  },

  // NEW: Business registration function
  registerBusiness: async (businessData: { name: string; currency_code: string }, ownerData: { email: string; username: string; password: string }): Promise<AuthResponse> => {
    console.log('authService.registerBusiness called with:', { businessData, ownerData });
    try {
      const response = await api.post<AuthResponse>('/api/auth/register/business', {
        business_data: businessData,
        owner_data: ownerData
      });
      console.log('Business registration response:', response.data);

      // Store the token for immediate login
      localStorage.setItem('auth_token', response.data.access_token);
      console.log('Access token stored for new business owner');

      return response.data;
    } catch (err) {
      console.error('Error during business registration:', err);
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
