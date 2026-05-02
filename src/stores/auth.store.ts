import { create } from 'zustand';
import { User, OfficeConfig } from '@/types/api';

interface AuthState {
  user: User | null;
  officeSettings: OfficeConfig | null;
  token: string | null;
  ready: boolean;
  login: (payload: { user: User; officeSettings: OfficeConfig; token: string }) => void;
  logout: () => void;
  setToken: (token: string) => void;
  setReady: (ready: boolean) => void;
  setOfficeSettings: (settings: OfficeConfig) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  officeSettings: null,
  token: null,
  ready: false,
  login: ({ user, officeSettings, token }) =>
    set({ user, officeSettings, token, ready: true }),
  logout: () =>
    set({ user: null, officeSettings: null, token: null, ready: true }),
  setToken: (token) => set({ token }),
  setReady: (ready) => set({ ready }),
  setOfficeSettings: (settings) => set({ officeSettings: settings }),
}));