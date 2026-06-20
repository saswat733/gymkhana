import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: unknown }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type StaffNote = {
  id: string;
  gymId: string;
  entityType: string;
  entityId: string;
  authorUserId: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; email: string };
};

export async function listMemberNotes(memberId: string) {
  const res = await api.get<ApiEnvelope<{ notes: StaffNote[] }>>(`/members/${memberId}/notes`);
  return unwrap(res.data).notes;
}

export async function createMemberNote(input: { memberId: string; body: string; pinned?: boolean }) {
  const res = await api.post<ApiEnvelope<{ note: StaffNote }>>(`/members/${input.memberId}/notes`, {
    body: input.body,
    pinned: input.pinned ?? false,
  });
  return unwrap(res.data).note;
}

export async function updateMemberNote(input: { memberId: string; noteId: string; body?: string; pinned?: boolean }) {
  const res = await api.patch<ApiEnvelope<{ note: StaffNote }>>(
    `/members/${input.memberId}/notes/${input.noteId}`,
    { body: input.body, pinned: input.pinned },
  );
  return unwrap(res.data).note;
}

export async function deleteMemberNote(input: { memberId: string; noteId: string }) {
  await api.delete(`/members/${input.memberId}/notes/${input.noteId}`);
}
