import { create } from 'zustand';
import { authService } from '../services/auth';
import { userService } from '../services/users';
import { User } from '../types';
// NEW: Import the response types
import { LoginResponse, TwoFactorRequiredResponse } from '../services/auth';

// NEW: Extend the state interface to track the 2FA pending state
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  // NEW: State for 2FA flow
  requires2FA: boolean;
  tempToken: string | null;
  login: (credentials: { identifier: string; password: string }) => Promise<void>;
  logout: () => void;
  // NEW: Function to clear the 2FA state (e.g., if user cancels)
  clear2FA: () => void;
  // NEW: Function to verify the 2FA code
  verify2FA: (code: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

// Zustand store for global state
export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  // NEW: Initialize 2FA state
  requires2FA: false,
  tempToken: null,

  // ADD THIS NEW FUNCTION
  initializeAuth: async () => {
    const token = authService.getToken();
    const isAuth = !!token;

    if (!isAuth) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    set({ isAuthenticated: true, isLoading: true });

    try {
      const userData = await userService.getCurrentUser();
      set({ user: userData, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // NEW: On error, log the user out to clear the invalid token
      get().logout();
    }
  },

  // CHANGED: Updated login function to handle 2FA response
  login: async (credentials) => {
    set({ isLoading: true });
    try {
      // NEW: authService.login now returns LoginResponse (Token or 2FA required)
      const response: LoginResponse = await authService.login(credentials);
      // DEBUG: Log the raw response from the server
      console.log("DEBUG - Login API Response:", response);

      // NEW: Check what type of response we got
      if ('requires_2fa' in response) {
        // If 2FA is required, update state to show the 2FA form
        const twoFAResponse = response as TwoFactorRequiredResponse;
        console.log("DEBUG - 2FA required. Setting state: requires2FA=true, tempToken=", twoFAResponse.temp_token);
        set({
          requires2FA: true,
          tempToken: twoFAResponse.temp_token,
          isLoading: false // Stop loading, show 2FA form
        });
        // Do NOT navigate, do NOT set isAuthenticated=true
        return; // Exit the function here
      }

      // NEW: If we get here, it's a normal AuthResponse with a token
      // The token is already saved by authService.login
      try {
        const userData = await userService.getCurrentUser();
        console.log("DEBUG - Normal login successful. Setting state: isAuthenticated=true");
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

  // NEW: Function to verify the 2FA code
  verify2FA: async (code: string) => {
    set({ isLoading: true });
    const { tempToken } = get(); // Get the tempToken from state
    if (!tempToken) {
      throw new Error('No pending authentication found');
    }

    try {
      // Call the new authService function we created
      await authService.verify2FA(tempToken, code);
      // If successful, verify2FA saved the token. Now get user data.
      const userData = await userService.getCurrentUser();
      set({
        isAuthenticated: true,
        user: userData,
        isLoading: false,
        requires2FA: false, // Clear the 2FA state
        tempToken: null
      });
    } catch (error) {
      console.error('2FA verification failed:', error);
      set({ isLoading: false });
      throw error; // Re-throw to handle in the UI
    }
  },

  // NEW: Function to clear the 2FA state
  clear2FA: () => {
    set({ requires2FA: false, tempToken: null, isLoading: false });
  },

  logout: () => {
    authService.logout();
    // NEW: Also clear the 2FA state on logout
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
      useAuthStore.getState().logout(); // NEW: Log out on init error
    });
}
