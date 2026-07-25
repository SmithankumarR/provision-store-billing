import { create } from 'zustand';
import { User, Store, UserRole } from '../types';
import api, { setAuthTokens } from '../services/api';

interface AuthState {
  user: User | null;
  store: Store | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  registerStore: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateStoreProfile: (data: Partial<Store>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  store: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { identifier, password });
      if (res.data.success) {
        const { user, store, tokens } = res.data.data;
        setAuthTokens(tokens.accessToken, tokens.refreshToken);
        set({
          user,
          store,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  registerStore: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register-store', data);
      if (res.data.success) {
        const { user, store, tokens } = res.data.data;
        setAuthTokens(tokens.accessToken, tokens.refreshToken);
        set({
          user,
          store,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Store registration failed.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      setAuthTokens(null, null);
      set({
        user: null,
        store: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    }
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        set({ user: res.data.data.user, store: res.data.data.store });
      }
    } catch (err) {}
  },

  updateStoreProfile: async (data: Partial<Store>) => {
    try {
      const res = await api.put('/store', data);
      if (res.data.success) {
        set({ store: res.data.data });
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update store profile');
    }
  },
}));
