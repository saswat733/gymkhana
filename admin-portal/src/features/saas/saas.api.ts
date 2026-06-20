import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type SaasPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceMonthlyCents: number;
  priceYearlyCents: number;
  currency: string;
  limitMembers: number | null;
  limitTrainers: number | null;
  isActive: boolean;
};

export type GymSaasSubscription = {
  id: string;
  gymId: string;
  saasPlanId: string;
  status: "trialing" | "active" | "past_due" | "cancelled";
  billingCycle: "monthly" | "yearly";
  startsAt: string;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  cancelledAt: string | null;
  SaasPlan?: SaasPlan;
};

export type SaasInvoice = {
  id: string;
  gymId: string;
  invoiceNumber: string;
  status: "draft" | "issued" | "paid" | "void";
  currency: string;
  amountCents: number;
  gstPercent: number | null;
  gstCents: number | null;
  totalCents: number;
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
};

export async function listSaasPlans() {
  const res = await api.get<ApiEnvelope<{ plans: SaasPlan[] }>>("/saas/plans");
  return unwrap(res.data).plans;
}

export async function getSaasSubscription() {
  const res = await api.get<ApiEnvelope<{ subscription: GymSaasSubscription | null }>>("/saas/subscription");
  return unwrap(res.data).subscription;
}

export async function startSaasSubscription(input: {
  planCode: string;
  billingCycle: "monthly" | "yearly";
  trialDays?: number;
}) {
  const res = await api.post<ApiEnvelope<{ subscription: GymSaasSubscription }>>("/saas/subscription/start", input);
  return unwrap(res.data).subscription;
}

export async function cancelSaasSubscription() {
  const res = await api.post<ApiEnvelope<{ subscription: GymSaasSubscription }>>("/saas/subscription/cancel");
  return unwrap(res.data).subscription;
}

export async function listSaasInvoices() {
  const res = await api.get<ApiEnvelope<{ invoices: SaasInvoice[] }>>("/saas/invoices");
  return unwrap(res.data).invoices;
}

export async function generateSaasInvoice(input?: { dueDays?: number; gstPercent?: number }) {
  const res = await api.post<ApiEnvelope<{ invoice: SaasInvoice }>>("/saas/invoices/generate", input ?? {});
  return unwrap(res.data).invoice;
}

export async function markSaasInvoicePaid(id: string) {
  const res = await api.post<ApiEnvelope<{ invoice: SaasInvoice }>>(`/saas/invoices/${id}/mark-paid`);
  return unwrap(res.data).invoice;
}

export async function createSaasRazorpayOrder(id: string) {
  const res = await api.post<ApiEnvelope<{ razorpay: { orderId: string; amount: number; currency: string; keyId: string } }>>(
    `/saas/invoices/${id}/razorpay-order`,
  );
  return unwrap(res.data).razorpay;
}
