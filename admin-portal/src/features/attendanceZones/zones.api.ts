import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type AttendanceZone = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isDefault: boolean;
};

export type QrSetup = {
  zones: AttendanceZone[];
  qrCodes: { zoneId: string; zoneName: string; isDefault: boolean; payload: string }[];
};

export async function listZones() {
  const res = await api.get<ApiEnvelope<{ zones: AttendanceZone[] }>>("/attendance-zones");
  return unwrap(res.data).zones;
}

export async function getQrSetup() {
  const res = await api.get<ApiEnvelope<QrSetup>>("/attendance-zones/qr-setup");
  return unwrap(res.data);
}

export async function createZone(input: { name: string; slug?: string; isDefault?: boolean }) {
  const res = await api.post<ApiEnvelope<{ zone: AttendanceZone }>>("/attendance-zones", input);
  return unwrap(res.data).zone;
}

export async function updateZone(id: string, patch: Partial<AttendanceZone>) {
  const res = await api.patch<ApiEnvelope<{ zone: AttendanceZone }>>(`/attendance-zones/${id}`, patch);
  return unwrap(res.data).zone;
}
