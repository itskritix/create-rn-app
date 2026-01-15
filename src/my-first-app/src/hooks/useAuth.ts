import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "../store/auth";

export function useAuth() {
  const { isAuthenticated, isHydrated, login, logout } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isHydrated: state.isHydrated,
      login: state.login,
      logout: state.logout,
    }))
  );

  return {
    isAuthenticated,
    isHydrated,
    login,
    logout,
  };
}
