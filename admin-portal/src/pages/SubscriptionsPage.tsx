import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { Plus, RefreshCcw, Search, XCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { cn } from "../lib/utils";
import { listMembers, type Member } from "../features/members/members.api";
import { listPlans, type Plan } from "../features/plans/plans.api";
import {
  cancelSubscription,
  createSubscription,
  listSubscriptions,
  renewSubscription,
  type Subscription,
} from "../features/subscriptions/subscriptions.api";
import { createFreeze } from "../features/freezes/freezes.api";
import { toast } from "sonner";

const schema = z.object({
  memberId: z.string().uuid(),
  planId: z.string().uuid(),
  startsAt: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const statusBadge = (status: Subscription["status"]) => {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-600";
    case "expired":
      return "bg-amber-500/10 text-amber-600";
    case "cancelled":
      return "bg-zinc-500/10 text-zinc-600";
    default:
      return "bg-zinc-500/10 text-zinc-600";
  }
};

export function SubscriptionsPage() {
  const qc = useQueryClient();
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [status, setStatus] = React.useState<string>("");

  const [open, setOpen] = React.useState(false);

  const subsQuery = useQuery({
    queryKey: ["subscriptions", { q, page, pageSize, status }],
    queryFn: async () => {
      // backend supports memberId and status; for quick UX allow "q" to be memberId if it looks like uuid
      const looksUuid = /^[0-9a-fA-F-]{36}$/.test(q.trim());
      return listSubscriptions({
        page,
        pageSize,
        status: status || undefined,
        memberId: looksUuid ? q.trim() : undefined,
      });
    },
    staleTime: 10_000,
  });

  const membersQuery = useQuery({
    queryKey: ["members", { q: "", page: 1, pageSize: 100 }],
    queryFn: () => listMembers({ page: 1, pageSize: 100 }),
    staleTime: 30_000,
  });

  const plansQuery = useQuery({
    queryKey: ["plans", { q: "", page: 1, pageSize: 100 }],
    queryFn: () => listPlans({ page: 1, pageSize: 100 }),
    staleTime: 30_000,
  });

  const createMut = useMutation({
    mutationFn: createSubscription,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Subscription created");
      setOpen(false);
    },
  });

  const cancelMut = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Subscription cancelled");
    },
  });

  const freezeMut = useMutation({
    mutationFn: ({ id, startsAt, endsAt }: { id: string; startsAt: string; endsAt: string }) =>
      createFreeze({ subscriptionId: id, startsAt, endsAt, reason: "Member request" }),
    onSuccess: async () => {
      toast.success("Membership frozen");
      await qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const renewMut = useMutation({
    mutationFn: renewSubscription,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Subscription renewed");
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { memberId: "", planId: "", startsAt: "" },
  });

  const members = (membersQuery.data?.members ?? []) as Member[];
  const plans = (plansQuery.data?.plans ?? []) as Plan[];
  const rows = subsQuery.data?.subscriptions ?? [];
  const meta = subsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const memberName = (id: string) => members.find((m) => m.id === id)?.User?.name ?? id.slice(0, 8);
  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Assign plans, renew, cancel, and track status.</p>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-[360px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by memberId (UUID)…"
              className="pl-9"
            />
          </div>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Assign plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign plan</DialogTitle>
                <DialogDescription>Create a new subscription for a member.</DialogDescription>
              </DialogHeader>

              <form className="space-y-4" onSubmit={form.handleSubmit((v) => createMut.mutate(v))}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Member</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.watch("memberId")}
                    onChange={(e) => form.setValue("memberId", e.target.value, { shouldValidate: true })}
                  >
                    <option value="">Select member…</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.User?.name} — {m.User?.email}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.memberId?.message ? (
                    <p className="text-sm text-destructive">{form.formState.errors.memberId.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Plan</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.watch("planId")}
                    onChange={(e) => form.setValue("planId", e.target.value, { shouldValidate: true })}
                  >
                    <option value="">Select plan…</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.durationMonths} mo)
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.planId?.message ? (
                    <p className="text-sm text-destructive">{form.formState.errors.planId.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Start date (optional)</label>
                  <Input type="date" value={form.watch("startsAt") || ""} onChange={(e) => form.setValue("startsAt", e.target.value)} />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMut.isPending}>
                    Assign
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription list</CardTitle>
          <CardDescription>{meta ? `${meta.total} total` : subsQuery.isLoading ? "Loading…" : "—"}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Member</th>
                  <th className="px-4 py-3 text-left font-medium">Plan</th>
                  <th className="px-4 py-3 text-left font-medium">Period</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subsQuery.isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                      Loading…
                    </td>
                  </tr>
                ) : subsQuery.isError ? (
                  <tr>
                    <td className="px-4 py-6 text-destructive" colSpan={5}>
                      Failed to load subscriptions.
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                      No subscriptions found.
                    </td>
                  </tr>
                ) : (
                  rows.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="font-medium">{memberName(s.memberId)}</div>
                        <div className="text-xs text-muted-foreground">Member: {s.memberId.slice(0, 8)}…</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{planName(s.planId)}</div>
                        <div className="text-xs text-muted-foreground">Plan: {s.planId.slice(0, 8)}…</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{s.startsAt} → {s.endsAt}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs", statusBadge(s.status))}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={renewMut.isPending || s.status === "cancelled"}
                            onClick={() => renewMut.mutate(s.id)}
                            title="Renew"
                          >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Renew
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={freezeMut.isPending || s.status !== "active"}
                            onClick={() => {
                              const start = new Date().toISOString().slice(0, 10);
                              const end = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
                              freezeMut.mutate({ id: s.id, startsAt: start, endsAt: end });
                            }}
                            title="Freeze 2 weeks"
                          >
                            Freeze
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={cancelMut.isPending || s.status === "cancelled"}
                            onClick={() => cancelMut.mutate(s.id)}
                            title="Cancel"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
            <div className="text-xs text-muted-foreground">
              Page {meta?.page ?? page} of {meta?.totalPages ?? totalPages}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

