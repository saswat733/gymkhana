import { create } from "zustand";

import { tokenStorage } from "./storage";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (next: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: tokenStorage.getAccessToken(),
  refreshToken: tokenStorage.getRefreshToken(),
  setAuth: ({ user, accessToken, refreshToken }) => {
    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);
    set({ user, accessToken, refreshToken });
  },
  clear: () => {
    tokenStorage.clear();
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));

