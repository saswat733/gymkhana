import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: unknown }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type WorkoutPlan = {
  id: string;
  memberId: string;
  trainerId: string | null;
  title: string;
  notes: string | null;
  planJson: unknown;
  isActive: boolean;
  createdAt: string;
};

export async function listWorkoutPlans(params?: { memberId?: string; q?: string }) {
  const res = await api.get<ApiEnvelope<{ workoutPlans: WorkoutPlan[] }>>("/workout-plans", { params });
  return unwrap(res.data).workoutPlans;
}

export async function createWorkoutPlan(input: {
  memberId: string;
  trainerId?: string | null;
  title: string;
  notes?: string;
  planJson?: unknown;
}) {
  const res = await api.post<ApiEnvelope<{ workoutPlan: WorkoutPlan }>>("/workout-plans", input);
  return unwrap(res.data).workoutPlan;
}

export async function deleteWorkoutPlan(id: string) {
  await api.delete(`/workout-plans/${id}`);
}
