import { create } from 'zustand';
import { authService } from '../services/auth';
import { userService } from '../services/users';
import { User } from '../types';
// Import the response types
import { LoginResponse, TwoFactorRequiredResponse } from '../services/auth';

// UPDATED: AuthState interface for RBAC
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  // State for 2FA flow (UNCHANGED)
  requires2FA: boolean;
  tempToken: string | null;
  // NEW: Helper function to check for a specific permission
  hasPermission: (permission: string) => boolean;
  login: (credentials: { identifier: string; password: string }) => Promise<void>;
  logout: () => void;
  clear2FA: () => void;
  verify2FA: (code: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

// Zustand store for global state - UPDATED FOR RBAC
export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  requires2FA: false,
  tempToken: null,

  // NEW: Permission check function
  hasPermission: (permission: string) => {
    const user = get().user;
    // Check if the user's permissions array includes the requested permission
    return user?.permissions ? user.permissions.includes(permission) : false;
  },

  initializeAuth: async () => {
    const token = authService.getToken();
    const isAuth = !!token;

    if (!isAuth) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    set({ isAuthenticated: true, isLoading: true });

    try {
      // This now returns a User object with a 'permissions' array
      const userData = await userService.getCurrentUser();
      set({ user: userData, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      get().logout();
    }
  },

  // CHANGED: Now handles user object with permissions
  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response: LoginResponse = await authService.login(credentials);
      console.log("DEBUG - Login API Response:", response);

      if ('requires_2fa' in response) {
        const twoFAResponse = response as TwoFactorRequiredResponse;
        console.log("DEBUG - 2FA required. Setting state: requires2FA=true, tempToken=", twoFAResponse.temp_token);
        set({
          requires2FA: true,
          tempToken: twoFAResponse.temp_token,
          isLoading: false
        });
        return;
      }

      // If we get here, it's a normal login
      try {
        // This now returns a User object with a 'permissions' array
        const userData = await userService.getCurrentUser();
        console.log("DEBUG - Normal login successful. User permissions:", userData.permissions);
        set({ isAuthenticated: true, user: userData, isLoading: false });
      } catch (userError) {
        console.error('Login successful but failed to fetch user data:', userError);
        set({ isAuthenticated: true, isLoading: false });
      }

    } catch (error) {
      console.error('Login failed:', error);
      set({ isLoading: false });
      throw new Error('Login failed');
    }
  },

  // UNCHANGED: 2FA logic remains the same
  verify2FA: async (code: string) => {
    set({ isLoading: true });
    const { tempToken } = get();
    if (!tempToken) {
      throw new Error('No pending authentication found');
    }

    try {
      await authService.verify2FA(tempToken, code);
      // This now returns a User object with a 'permissions' array
      const userData = await userService.getCurrentUser();
      set({
        isAuthenticated: true,
        user: userData,
        isLoading: false,
        requires2FA: false,
        tempToken: null
      });
    } catch (error) {
      console.error('2FA verification failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  clear2FA: () => {
    set({ requires2FA: false, tempToken: null, isLoading: false });
  },

  logout: () => {
    authService.logout();
    set({ isAuthenticated: false, user: null, isLoading: false, requires2FA: false, tempToken: null });
  },

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading })
}));

// Keep your existing initialization code at the bottom
const token = authService.getToken();
if (token) {
  useAuthStore.setState({ isAuthenticated: true, isLoading: false });
  userService.getCurrentUser()
    .then(user => useAuthStore.setState({ user }))
    .catch(error => {
      console.error('Failed to fetch user data on init:', error);
      useAuthStore.getState().logout();
    });
}
