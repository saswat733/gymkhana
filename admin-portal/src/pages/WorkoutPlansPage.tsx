import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { listMembers } from "../features/members/members.api";
import { createWorkoutPlan, deleteWorkoutPlan, listWorkoutPlans } from "../features/workoutPlans/workoutPlans.api";

export function WorkoutPlansPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const plansQ = useQuery({ queryKey: ["workout-plans"], queryFn: () => listWorkoutPlans() });
  const membersQ = useQuery({
    queryKey: ["members", "picker"],
    queryFn: () => listMembers({ page: 1, pageSize: 100 }),
  });

  const createMut = useMutation({
    mutationFn: () => createWorkoutPlan({ memberId, title, notes }),
    onSuccess: async () => {
      toast.success("Workout plan created");
      setOpen(false);
      setMemberId("");
      setTitle("");
      setNotes("");
      await qc.invalidateQueries({ queryKey: ["workout-plans"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });

  const delMut = useMutation({
    mutationFn: deleteWorkoutPlan,
    onSuccess: async () => {
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: ["workout-plans"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });

  const members = membersQ.data?.members ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workout plans</h1>
          <p className="text-sm text-muted-foreground">Assign training plans to members.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New workout plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              >
                <option value="">Select member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.User.name} ({m.User.email})
                  </option>
                ))}
              </select>
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="Notes / exercises" value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} />
            </div>
            <DialogFooter>
              <Button onClick={() => createMut.mutate()} disabled={!memberId || !title || createMut.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>Visible to members in the mobile app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {plansQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (plansQ.data ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No workout plans yet.</div>
          ) : (
            (plansQ.data ?? []).map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                <div>
                  <div className="font-medium">{p.title}</div>
                  {p.notes ? <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{p.notes}</div> : null}
                  <div className="mt-1 text-xs text-muted-foreground">Member: {p.memberId.slice(0, 8)}…</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => delMut.mutate(p.id)}>
                  Delete
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
