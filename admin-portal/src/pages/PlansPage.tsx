import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { Edit3, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { cn } from "../lib/utils";
import { createPlan, listPlans, setPlanActive, updatePlan, type Plan } from "../features/plans/plans.api";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2).max(120),
  durationMonths: z.coerce.number().int().min(1).max(120),
  priceCents: z.coerce.number().int().min(0).max(100_000_000),
  perks: z.string().max(5000).optional().nullable(),
});
type FormValues = z.infer<typeof schema>;

const formatMoney = (cents: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format((cents || 0) / 100);

export function PlansPage() {
  const qc = useQueryClient();
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Plan | null>(null);

  const plansQuery = useQuery({
    queryKey: ["plans", { q, page, pageSize }],
    queryFn: () => listPlans({ q: q || undefined, page, pageSize }),
    staleTime: 10_000,
  });

  const toggleActive = useMutation({
    mutationFn: setPlanActive,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });

  const savePlan = useMutation({
    mutationFn: async (values: FormValues) => {
      if (editing) return updatePlan({ id: editing.id, ...values });
      return createPlan(values);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["plans"] });
      toast.success(editing ? "Plan updated" : "Plan created");
      setOpen(false);
      setEditing(null);
    },
  });

  const form = useForm<FormValues>({
    // zodResolver types can become incompatible under verbatimModuleSyntax + coercion.
    resolver: zodResolver(schema) as any,
    defaultValues: { name: "", durationMonths: 1, priceCents: 0, perks: "" },
  });

  const rows = plansQuery.data?.plans ?? [];
  const meta = plansQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const startCreate = () => {
    setEditing(null);
    form.reset({ name: "", durationMonths: 1, priceCents: 0, perks: "" });
    setOpen(true);
  };

  const startEdit = (p: Plan) => {
    setEditing(p);
    form.reset({
      name: p.name,
      durationMonths: p.durationMonths,
      priceCents: p.priceCents,
      perks: p.perks ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
          <p className="text-sm text-muted-foreground">Manage subscription plans and pricing.</p>
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
              placeholder="Search plans…"
              className="pl-9"
            />
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={startCreate}>
                <Plus className="mr-2 h-4 w-4" />
                New plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit plan" : "Create plan"}</DialogTitle>
                <DialogDescription>Plans are used when assigning subscriptions to members.</DialogDescription>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => savePlan.mutate(values))}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input {...form.register("name")} placeholder="Monthly" />
                  {form.formState.errors.name?.message ? (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (months)</label>
                    <Input type="number" min={1} max={120} {...form.register("durationMonths")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price (cents)</label>
                    <Input type="number" min={0} {...form.register("priceCents")} />
                    <p className="text-xs text-muted-foreground">
                      Preview: {formatMoney(form.watch("priceCents") || 0)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Perks</label>
                  <Textarea {...form.register("perks")} placeholder="e.g. Access to all equipment, 1 PT session…" />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={savePlan.isPending}>
                    {editing ? "Save changes" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan list</CardTitle>
          <CardDescription>{meta ? `${meta.total} total` : plansQuery.isLoading ? "Loading…" : "—"}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Duration</th>
                  <th className="px-4 py-3 text-left font-medium">Price</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plansQuery.isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                      Loading…
                    </td>
                  </tr>
                ) : plansQuery.isError ? (
                  <tr>
                    <td className="px-4 py-6 text-destructive" colSpan={5}>
                      Failed to load plans.
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                      No plans found.
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {p.id.slice(0, 8)}…</div>
                      </td>
                      <td className="px-4 py-3">{p.durationMonths} mo</td>
                      <td className="px-4 py-3">{formatMoney(p.priceCents)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                            p.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-zinc-500/10 text-zinc-600",
                          )}
                        >
                          {p.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(p)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={toggleActive.isPending}
                            onClick={() => toggleActive.mutate({ id: p.id, isActive: !p.isActive })}
                          >
                            {p.isActive ? (
                              <>
                                <ToggleLeft className="mr-2 h-4 w-4" />
                                Disable
                              </>
                            ) : (
                              <>
                                <ToggleRight className="mr-2 h-4 w-4" />
                                Enable
                              </>
                            )}
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

