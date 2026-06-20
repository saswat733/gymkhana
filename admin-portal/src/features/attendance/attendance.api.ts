import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: any }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type Attendance = {
  id: string;
  memberId: string;
  checkInAt: string;
  checkOutAt: string | null;
  source: "manual" | "qr" | "biometric";
  createdAt: string;
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function listAttendance(params: { page?: number; pageSize?: number; memberId?: string; from?: string; to?: string }) {
  const res = await api.get<ApiEnvelope<{ attendance: Attendance[] }>>("/attendance", { params });
  const data = unwrap(res.data);
  return { attendance: data.attendance, meta: (res.data as any).meta as PageMeta | undefined };
}

