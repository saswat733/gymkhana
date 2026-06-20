import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type SubscriptionFreeze = {
  id: string;
  subscriptionId: string;
  memberId: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  status: string;
  daysFrozen: number;
};

export async function createFreeze(input: { subscriptionId: string; startsAt: string; endsAt: string; reason?: string }) {
  const res = await api.post<ApiEnvelope<{ freeze: SubscriptionFreeze }>>("/freezes", input);
  return unwrap(res.data).freeze;
}

export async function listFreezes(memberId?: string) {
  const res = await api.get<ApiEnvelope<{ freezes: SubscriptionFreeze[] }>>("/freezes", { params: { memberId } });
  return unwrap(res.data).freezes;
}
