import { api, unwrap } from "../../lib/api";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: "all" | "members" | "trainers" | "admins";
  isPublished: boolean;
  publishAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listAnnouncements(params?: { page?: number; pageSize?: number }) {
  const res = await api.get<any>("/announcements", {
    params: { page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 },
  });
  const data = unwrap<{ announcements: Announcement[] }>(res.data);
  return data.announcements;
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  audience?: Announcement["audience"];
  isPublished?: boolean;
  publishAt?: string | null;
  expiresAt?: string | null;
}) {
  const res = await api.post<any>("/announcements", input);
  return unwrap<{ announcement: Announcement }>(res.data).announcement;
}

export async function updateAnnouncement(id: string, patch: Partial<Omit<Announcement, "id" | "createdAt" | "updatedAt">>) {
  const res = await api.patch<any>(`/announcements/${id}`, patch);
  return unwrap<{ announcement: Announcement }>(res.data).announcement;
}

export async function deleteAnnouncement(id: string) {
  await api.delete(`/announcements/${id}`);
}

