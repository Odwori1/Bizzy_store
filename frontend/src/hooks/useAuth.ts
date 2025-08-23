import { create } from 'zustand'
import { authService } from '../services/auth'
import { userService } from '../services/users' // ADD THIS IMPORT
import { User } from '../types'

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
  initialize: () => void
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

// Zustand store for global state
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,

  initialize: () => {
    const isAuth = authService.isAuthenticated()
    set({ isAuthenticated: isAuth, isLoading: false })
    
    // If authenticated, try to fetch user data
    if (isAuth) {
      userService.getCurrentUser()
        .then(user => set({ user }))
        .catch(error => {
          console.error('Failed to fetch user data:', error)
          // Don't log out, just keep user as null
        })
    }
  },

  login: async (credentials) => {
    set({ isLoading: true })
    try {
      const response = await authService.login(credentials)
      localStorage.setItem('auth_token', response.access_token)
      
      // FETCH USER DATA AFTER SUCCESSFUL LOGIN
      try {
        const userData = await userService.getCurrentUser()
        set({ isAuthenticated: true, user: userData, isLoading: false })
      } catch (userError) {
        console.error('Login successful but failed to fetch user data:', userError)
        // Still set as authenticated but without user data
        set({ isAuthenticated: true, isLoading: false })
      }
      
    } catch (error) {
      console.error('Login failed:', error)
      set({ isLoading: false })
      throw new Error('Login failed')
    }
  },

  logout: () => {
    authService.logout()
    set({ isAuthenticated: false, user: null, isLoading: false })
  },

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading })
}))

// Initialize auth state
const token = authService.getToken()
if (token) {
  useAuthStore.setState({ isAuthenticated: true, isLoading: false })
  // Also try to fetch user data on app start
  userService.getCurrentUser()
    .then(user => useAuthStore.setState({ user }))
    .catch(error => {
      console.error('Failed to fetch user data on init:', error)
    })
}
