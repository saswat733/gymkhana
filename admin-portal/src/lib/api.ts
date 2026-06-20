import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

import { env } from "./env";
import { useAuthStore } from "./authStore";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: unknown }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

const isUnprocessable = (err: AxiosError) => err.response?.status === 422;

let refreshPromise: Promise<string> | null = null;

const createClient = () => {
  const client = axios.create({
    baseURL: env.apiBaseUrl,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: false,
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<ApiEnvelope<unknown>>) => {
      const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
      if (!original) throw error;

      if (error.response?.status !== 401) throw error;
      if (original._retry) throw error;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) throw error;

      original._retry = true;

      refreshPromise ??= (async () => {
        const resp = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
          `${env.apiBaseUrl}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );

        if (!resp.data || resp.data.success !== true) {
          useAuthStore.getState().clear();
          throw new Error("Refresh failed");
        }

        const tokens = resp.data.data;

        // Fetch fresh user using the new token to keep store consistent.
        const me = await axios.get<ApiEnvelope<{ user: any }>>(`${env.apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        if (!me.data || me.data.success !== true) {
          useAuthStore.getState().clear();
          throw new Error("Failed to load session");
        }

        useAuthStore.getState().setAuth({ user: me.data.data.user, ...tokens });
        return tokens.accessToken;
      })().finally(() => {
        refreshPromise = null;
      });

      const newAccess = await refreshPromise;
      original.headers.Authorization = `Bearer ${newAccess}`;
      return client.request(original);
    },
  );

  return client;
};

export const api = createClient();

export const unwrap = <T>(envelope: ApiEnvelope<T>): T => {
  if (envelope && (envelope as any).success === true) return (envelope as any).data as T;
  const message =
    (envelope as any)?.message ??
    (envelope as any)?.error?.code ??
    "Request failed";
  throw new Error(message);
};

export const extractFieldErrors = (err: unknown): Record<string, string> => {
  if (!axios.isAxiosError(err)) return {};
  if (!isUnprocessable(err)) return {};
  const details = (err.response?.data as any)?.error?.details;
  if (!Array.isArray(details)) return {};
  const out: Record<string, string> = {};
  for (const d of details) {
    if (d?.field && d?.message) out[String(d.field)] = String(d.message);
  }
  return out;
};

