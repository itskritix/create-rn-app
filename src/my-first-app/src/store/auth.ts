import { create } from "zustand";
import { getToken, setToken, deleteToken } from "../lib/storage";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  login: async (token: string) => {
    await setToken(token);
    set({ token, isAuthenticated: true });
  },

  logout: async () => {
    await deleteToken();
    set({ token: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const token = await getToken();
    set({
      token,
      isAuthenticated: !!token,
      isHydrated: true,
    });
  },
}));
