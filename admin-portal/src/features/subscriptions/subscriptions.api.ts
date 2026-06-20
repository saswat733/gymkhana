import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: any }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type Subscription = {
  id: string;
  memberId: string;
  planId: string;
  startsAt: string; // DATEONLY
  endsAt: string; // DATEONLY
  status: "active" | "expired" | "cancelled";
  autoRenew: boolean;
  cancelledAt: string | null;
  createdAt: string;
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function listSubscriptions(params: { page?: number; pageSize?: number; memberId?: string; status?: string }) {
  const res = await api.get<ApiEnvelope<{ subscriptions: Subscription[] }>>("/subscriptions", { params });
  const data = unwrap(res.data);
  return { subscriptions: data.subscriptions, meta: (res.data as any).meta as PageMeta | undefined };
}

export async function createSubscription(input: { memberId: string; planId: string; startsAt?: string; autoRenew?: boolean }) {
  const res = await api.post<ApiEnvelope<{ subscription: Subscription }>>("/subscriptions", input);
  return unwrap(res.data).subscription;
}

export async function cancelSubscription(id: string) {
  const res = await api.post<ApiEnvelope<{ subscription: Subscription }>>(`/subscriptions/${id}/cancel`);
  return unwrap(res.data).subscription;
}

export async function renewSubscription(id: string) {
  const res = await api.post<ApiEnvelope<{ subscription: Subscription }>>(`/subscriptions/${id}/renew`);
  return unwrap(res.data).subscription;
}

