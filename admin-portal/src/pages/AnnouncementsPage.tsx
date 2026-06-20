import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";

import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "../features/announcements/announcements.api";
import type { Announcement } from "../features/announcements/announcements.api";

export function AnnouncementsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const q = useQuery({
    queryKey: ["announcements"],
    queryFn: () => listAnnouncements({ page: 1, pageSize: 100 }),
  });

  const rows = useMemo(() => q.data ?? [], [q.data]);

  const createMut = useMutation({
    mutationFn: () => createAnnouncement({ title, body, audience: "all", isPublished: true }),
    onSuccess: async () => {
      toast.success("Announcement created");
      setTitle("");
      setBody("");
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      updateAnnouncement(id, { isPublished }),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["announcements"] }),
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: async () => {
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">Messages shown in the mobile “Messages” tab.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New announcement</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Title</div>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Holiday hours, new batch..." />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Body</div>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Write the message..." />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createMut.isPending}
              >
                Cancel
              </Button>
              <Button onClick={() => createMut.mutate()} disabled={!title.trim() || !body.trim() || createMut.isPending}>
                {createMut.isPending ? "Creating..." : "Create & publish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All announcements</CardTitle>
          <CardDescription>{q.isLoading ? "Loading..." : `${rows.length} total`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {q.isError ? <div className="text-sm text-destructive">Failed to load.</div> : null}

          {rows.map((a: Announcement) => (
            <div key={a.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{a.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {a.isPublished ? "Published" : "Draft"} · {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => toggleMut.mutate({ id: a.id, isPublished: !a.isPublished })}
                    disabled={toggleMut.isPending}
                  >
                    {a.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => delMut.mutate(a.id)}
                    disabled={delMut.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {!q.isLoading && rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No announcements yet.</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

