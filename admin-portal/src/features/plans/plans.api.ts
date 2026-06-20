import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: any }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type Plan = {
  id: string;
  name: string;
  durationMonths: number;
  priceCents: number;
  perks: string | null;
  isActive: boolean;
  createdAt: string;
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function listPlans(params: { page?: number; pageSize?: number; q?: string; isActive?: boolean }) {
  const res = await api.get<ApiEnvelope<{ plans: Plan[] }>>("/plans", { params });
  const data = unwrap(res.data);
  return { plans: data.plans, meta: (res.data as any).meta as PageMeta | undefined };
}

export async function createPlan(input: {
  name: string;
  durationMonths: number;
  priceCents: number;
  perks?: string | null;
  isActive?: boolean;
}) {
  const res = await api.post<ApiEnvelope<{ plan: Plan }>>("/plans", input);
  return unwrap(res.data).plan;
}

export async function updatePlan(input: { id: string } & Partial<Omit<Plan, "id" | "createdAt">>) {
  const { id, ...patch } = input;
  const res = await api.patch<ApiEnvelope<{ plan: Plan }>>(`/plans/${id}`, patch);
  return unwrap(res.data).plan;
}

export async function setPlanActive(input: { id: string; isActive: boolean }) {
  const res = await api.patch<ApiEnvelope<{ plan: Plan }>>(`/plans/${input.id}/active`, { isActive: input.isActive });
  return unwrap(res.data).plan;
}

