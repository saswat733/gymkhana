import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: any }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type Payment = {
  id: string;
  subscriptionId: string;
  amountCents: number;
  currency: string;
  method: string;
  status: string;
  paidAt: string;
  gatewayRef: string | null;
  notes: string | null;
  createdAt: string;
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function listPayments(params: { subscriptionId: string; page?: number; pageSize?: number }) {
  const res = await api.get<ApiEnvelope<{ payments: Payment[] }>>("/payments", { params });
  const data = unwrap(res.data);
  return { payments: data.payments, meta: (res.data as any).meta as PageMeta | undefined };
}

export async function recordPayment(input: {
  idempotencyKey: string;
  subscriptionId: string;
  amountCents: number;
  currency?: string;
  method: string;
  status?: string;
  paidAt?: string;
  gatewayRef?: string | null;
  notes?: string | null;
}) {
  const { idempotencyKey, ...body } = input;
  const res = await api.post<ApiEnvelope<{ payment: Payment }>>("/payments", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return unwrap(res.data).payment;
}

