const ACCESS_TOKEN_KEY = "gymkhana.admin.accessToken";
const REFRESH_TOKEN_KEY = "gymkhana.admin.refreshToken";

export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setAccessToken(token: string | null) {
    if (!token) localStorage.removeItem(ACCESS_TOKEN_KEY);
    else localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken(token: string | null) {
    if (!token) localStorage.removeItem(REFRESH_TOKEN_KEY);
    else localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

