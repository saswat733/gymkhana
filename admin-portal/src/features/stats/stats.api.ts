import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: unknown }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type DashboardKpis = {
  activeSubscriptions: number;
  revenueMtdCents: number;
  todayCheckIns: number;
  expiringSoon: number;
  currency: string;
  computedAt: string;
};

export async function getKpis() {
  const res = await api.get<ApiEnvelope<{ kpis: DashboardKpis }>>("/stats/kpis");
  return unwrap(res.data).kpis;
}

export type MrrMetrics = {
  mrrCents: number;
  arrCents: number;
  activeSubscriptions: number;
  totalMembers: number;
  renewalsThisMonth: number;
  renewalRatePercent: number;
  paymentsThisMonth: number;
  currency: string;
};

export async function getMrrMetrics() {
  const res = await api.get<ApiEnvelope<{ metrics: MrrMetrics }>>("/stats/mrr");
  return unwrap(res.data).metrics;
}

