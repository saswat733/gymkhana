import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: unknown }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type TrainerRow = {
  id: string;
  userId: string;
  bio: string | null;
  specialization: string | null;
  isActive: boolean;
  User?: { id: string; name: string; email: string; phone: string | null };
};

export async function listTrainers(params?: { q?: string; page?: number; pageSize?: number }) {
  const res = await api.get<ApiEnvelope<{ trainers: TrainerRow[] }>>("/trainers", { params });
  return unwrap(res.data).trainers;
}

export async function createTrainer(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  specialization?: string;
  bio?: string;
}) {
  const res = await api.post<ApiEnvelope<{ user: unknown; trainer: TrainerRow }>>("/trainers", input);
  return unwrap(res.data);
}

export async function assignMember(trainerId: string, memberId: string) {
  const res = await api.post<ApiEnvelope<unknown>>(`/trainers/${trainerId}/members`, { memberId });
  return unwrap(res.data);
}
