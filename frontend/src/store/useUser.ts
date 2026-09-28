import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'STUDENT' | 'VOLUNTEER' | 'ADMIN' | 'SUPER_ADMIN' | 'CONTRIBUTOR';
  gender?: string;
  aadhaarVerified?: boolean;
  volunteerProfileId?: string | null;
  candidateProfileId?: string | null;
  profileImageUrl?: string | null;
  // ... other fields
}

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isFullyVerified: boolean;
  aadhaarVerified: boolean; // computed from user
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  digilockerLogin: (role: string) => void;
}

export const useUser = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isFullyVerified: false,
      aadhaarVerified: false,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isFullyVerified: !!user,
          aadhaarVerified: !!user?.aadhaarVerified,
        });
      },
      setToken: (token) => set({ token }),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isFullyVerified: false, aadhaarVerified: false });
        localStorage.removeItem('jwtToken');
        window.location.href = '/';
      },

      // ---------- Email/Password Login ----------
      login: async (email: string, password: string) => {
        try {
          const response = await apiClient.post('/auth/login', { email, password });
          const { token, user } = response.data;
          set({ token, user, isAuthenticated: true, isFullyVerified: true, aadhaarVerified: user.aadhaarVerified });
          localStorage.setItem('jwtToken', token);
          toast.success('Logged in successfully');
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Login failed');
          throw error;
        }
      },

      // ---------- Signup (full details + DigiLocker) ----------
      signup: async (data: any) => {
        // data contains all fields from the signup form, including role, name, email, password, etc.
        try {
          const response = await apiClient.post('/auth/signup', data);
          // If signup is successful but requires DigiLocker verification, backend returns a redirect URL
          if (response.data.redirectUrl) {
            // Store signup data in session storage for later callback
            sessionStorage.setItem('signupData', JSON.stringify(data));
            window.location.href = response.data.redirectUrl;
          } else {
            // If no DigiLocker required (e.g., contributor), auto-login
            const { token, user } = response.data;
            set({ token, user, isAuthenticated: true, isFullyVerified: true, aadhaarVerified: user.aadhaarVerified });
            localStorage.setItem('jwtToken', token);
            toast.success('Account created!');
          }
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Signup failed');
          throw error;
        }
      },

      // ---------- Google Login ----------
      googleLogin: async (credential: string) => {
        try {
          const response = await apiClient.post('/auth/google', { credential });
          const { token, user } = response.data;
          set({ token, user, isAuthenticated: true, isFullyVerified: true, aadhaarVerified: user.aadhaarVerified });
          localStorage.setItem('jwtToken', token);
          toast.success('Logged in with Google');
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Google login failed');
          throw error;
        }
      },

      // ---------- DigiLocker Login (initiate) ----------
      digilockerLogin: (role: string) => {
        // Redirect to backend to initiate DigiLocker flow
        window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/digilocker/initiate?role=${role}`;
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isFullyVerified: state.isFullyVerified,
        aadhaarVerified: state.aadhaarVerified,
      }),
    }
  )
);