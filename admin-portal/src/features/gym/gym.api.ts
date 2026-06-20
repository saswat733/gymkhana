import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type GymProfile = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  legalName: string | null;
  gstin: string | null;
  billingAddressLine1: string | null;
  billingAddressLine2: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPincode: string | null;
  defaultGstPercent?: number;
  logoUrl?: string | null;
  brandPrimaryColor?: string | null;
  brandSecondaryColor?: string | null;
  customDomain?: string | null;
};

export async function getMyGym() {
  const res = await api.get<ApiEnvelope<{ gym: GymProfile }>>("/gyms/me");
  return unwrap(res.data).gym;
}

export async function updateMyGym(patch: Partial<GymProfile>) {
  const res = await api.patch<ApiEnvelope<{ gym: GymProfile }>>("/gyms/me", patch);
  return unwrap(res.data).gym;
}

export async function onboardGym(input: {
  gymName: string;
  slug?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerPhone?: string;
  planCode?: string;
  billingCycle?: "monthly" | "yearly";
}) {
  const res = await api.post<
    ApiEnvelope<{ gym: GymProfile; owner: unknown; accessToken: string; refreshToken: string }>
  >("/gyms/onboard", input);
  return unwrap(res.data);
}
