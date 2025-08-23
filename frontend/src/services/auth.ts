import { api } from './api'

export interface LoginCredentials {
  identifier: string // CHANGED from email to identifier
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/token', credentials)
    localStorage.setItem('auth_token', response.data.access_token)
    return response.data
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  },

  getToken: (): string | null => {
    return localStorage.getItem('auth_token')
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token')
  },
}
