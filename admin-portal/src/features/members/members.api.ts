import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: any }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type MemberUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
};

export type Member = {
  id: string;
  userId: string;
  isActive: boolean;
  joinedAt: string;
  createdAt: string;
  User: MemberUser;
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function listMembers(params: { page?: number; pageSize?: number; q?: string }) {
  const res = await api.get<ApiEnvelope<{ members: Member[] }>>("/members", { params });
  const data = unwrap(res.data);
  return { members: data.members, meta: (res.data as any).meta as PageMeta | undefined };
}

export async function getMember(id: string) {
  const res = await api.get<ApiEnvelope<{ member: Member }>>(`/members/${id}`);
  return unwrap(res.data).member;
}

export async function setMemberActive(input: { id: string; isActive: boolean }) {
  const res = await api.patch<ApiEnvelope<{ member: Member }>>(`/members/${input.id}/active`, { isActive: input.isActive });
  return unwrap(res.data).member;
}

