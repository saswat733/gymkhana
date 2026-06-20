import axios from "axios";

import { env } from "../../lib/env";
import { api, unwrap } from "../../lib/api";
import type { AuthUser } from "../../lib/authStore";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: unknown }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export async function login(input: { email: string; password: string }) {
  const res = await axios.post<ApiEnvelope<LoginResponse>>(`${env.apiBaseUrl}/auth/login`, input, {
    headers: { "Content-Type": "application/json" },
  });
  return unwrap(res.data);
}

export async function me() {
  const res = await api.get<ApiEnvelope<{ user: AuthUser }>>("/auth/me");
  return unwrap(res.data).user;
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const res = await api.post<ApiEnvelope<LoginResponse>>("/auth/change-password", input);
  return unwrap(res.data);
}

