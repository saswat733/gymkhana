import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { createTrainer, listTrainers } from "../features/trainers/trainers.api";

export function TrainersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");

  const q = useQuery({ queryKey: ["trainers"], queryFn: () => listTrainers() });

  const createMut = useMutation({
    mutationFn: () => createTrainer({ name, email, password, specialization }),
    onSuccess: async () => {
      toast.success("Trainer created");
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setSpecialization("");
      await qc.invalidateQueries({ queryKey: ["trainers"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trainers</h1>
          <p className="text-sm text-muted-foreground">Staff who can manage members and workout plans.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add trainer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New trainer</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Input placeholder="Specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
            </div>
            <DialogFooter>
              <Button onClick={() => createMut.mutate()} disabled={createMut.isPending || !name || !email || !password}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>Active trainers in your gym.</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : q.isError ? (
            <div className="text-sm text-destructive">Failed to load trainers.</div>
          ) : (q.data ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No trainers yet.</div>
          ) : (
            <div className="divide-y">
              {(q.data ?? []).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{t.User?.name ?? "—"}</div>
                    <div className="text-muted-foreground">{t.User?.email}</div>
                    {t.specialization ? <div className="text-xs text-muted-foreground">{t.specialization}</div> : null}
                  </div>
                  <div className={t.isActive ? "text-emerald-600" : "text-muted-foreground"}>
                    {t.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
