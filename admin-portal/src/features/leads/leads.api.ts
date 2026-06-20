import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: unknown }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: "created" | "trial_scheduled" | "trial_completed" | "converted" | "lost";
  notes: string | null;
  followUpAt: string | null;
  assignedToUserId: string | null;
  convertedMemberId: string | null;
  trialSubscriptionId: string | null;
  createdAt: string;
};

export async function listLeads(params?: { status?: string; q?: string }) {
  const res = await api.get<ApiEnvelope<{ leads: Lead[] }>>("/leads", { params: { page: 1, pageSize: 100, ...params } });
  return unwrap(res.data).leads;
}

export async function createLead(input: Partial<Lead> & { name: string }) {
  const res = await api.post<ApiEnvelope<{ lead: Lead }>>("/leads", input);
  return unwrap(res.data).lead;
}

export async function updateLead(id: string, patch: Partial<Lead>) {
  const res = await api.patch<ApiEnvelope<{ lead: Lead }>>(`/leads/${id}`, patch);
  return unwrap(res.data).lead;
}

export async function startLeadTrial(id: string, planId: string) {
  const res = await api.post<ApiEnvelope<unknown>>(`/leads/${id}/start-trial`, { planId });
  return unwrap(res.data);
}

export async function convertLead(id: string, memberId: string) {
  const res = await api.post<ApiEnvelope<{ lead: Lead }>>(`/leads/${id}/convert`, { memberId });
  return unwrap(res.data).lead;
}
