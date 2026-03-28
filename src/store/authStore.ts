import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/authApi";
import { clearStoredAddress } from "@/lib/checkoutStorage";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => {
        clearStoredAddress();
        set({ token: null, user: null });
      },
    }),
    { name: "fk-auth-storage" },
  ),
);
