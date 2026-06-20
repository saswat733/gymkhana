import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type VerifyPassResult = {
  member: { id: string; name: string; email: string };
  subscriptionValid: boolean;
  subscriptionEndsAt: string | null;
  checkedIn: boolean;
};

export async function verifyPass(passCode: string, checkIn = true) {
  const res = await api.post<ApiEnvelope<VerifyPassResult>>("/attendance/verify-pass", { passCode, checkIn });
  return unwrap(res.data);
}
