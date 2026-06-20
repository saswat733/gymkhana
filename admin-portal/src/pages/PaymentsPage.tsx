import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { Plus } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { listMembers } from "../features/members/members.api";
import { listPlans } from "../features/plans/plans.api";
import { listSubscriptions } from "../features/subscriptions/subscriptions.api";
import { listPayments, recordPayment } from "../features/payments/payments.api";
import { toast } from "sonner";

const paymentSchema = z.object({
  subscriptionId: z.string().uuid(),
  amountCents: z.coerce.number().int().min(0).max(100_000_000),
  method: z.string().min(1).max(30),
  notes: z.string().max(5000).optional().nullable(),
  gatewayRef: z.string().max(120).optional().nullable(),
});
type PaymentForm = z.infer<typeof paymentSchema>;

const formatMoney = (cents: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format((Number(cents) || 0) / 100);

const uuid = () => {
  // modern browsers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `idmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export function PaymentsPage() {
  const qc = useQueryClient();
  const [memberId, setMemberId] = React.useState("");
  const [subscriptionId, setSubscriptionId] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const [open, setOpen] = React.useState(false);

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

  const subsQuery = useQuery({
    queryKey: ["subscriptions", { memberId, page: 1, pageSize: 100 }],
    queryFn: () => (memberId ? listSubscriptions({ memberId, page: 1, pageSize: 100 }) : Promise.resolve({ subscriptions: [], meta: undefined })),
    enabled: Boolean(memberId),
    staleTime: 10_000,
  });

  React.useEffect(() => {
    // reset subscription + paging when member changes
    setSubscriptionId("");
    setPage(1);
  }, [memberId]);

  const paymentsQuery = useQuery({
    queryKey: ["payments", { subscriptionId, page, pageSize }],
    queryFn: () => listPayments({ subscriptionId, page, pageSize }),
    enabled: Boolean(subscriptionId),
    staleTime: 10_000,
  });

  const recordMut = useMutation({
    mutationFn: recordPayment,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment recorded");
      setOpen(false);
    },
  });

  const form = useForm<PaymentForm>({
    // zodResolver types can become incompatible under verbatimModuleSyntax + coercion.
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: { subscriptionId: "", amountCents: 0, method: "cash", notes: "", gatewayRef: "" },
  });

  React.useEffect(() => {
    form.setValue("subscriptionId", subscriptionId, { shouldValidate: true });
  }, [form, subscriptionId]);

  const members = membersQuery.data?.members ?? [];
  const plans = plansQuery.data?.plans ?? [];
  const subs = subsQuery.data?.subscriptions ?? [];

  const meta = paymentsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const rows = paymentsQuery.data?.payments ?? [];

  const planName = (planId: string) => plans.find((p) => p.id === planId)?.name ?? planId.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">Record payments and view payment history.</p>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm md:w-[360px]"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
          >
            <option value="">Select member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.User?.name} — {m.User?.email}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm md:w-[360px]"
            value={subscriptionId}
            onChange={(e) => {
              setSubscriptionId(e.target.value);
              setPage(1);
            }}
            disabled={!memberId}
          >
            <option value="">{memberId ? "Select subscription…" : "Select member first"}</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {planName(s.planId)} — {s.status} — ends {s.endsAt}
              </option>
            ))}
          </select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!subscriptionId}>
                <Plus className="mr-2 h-4 w-4" />
                Record payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record payment</DialogTitle>
                <DialogDescription>Creates a payment record (idempotent).</DialogDescription>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) =>
                  recordMut.mutate({
                    idempotencyKey: uuid(),
                    ...values,
                    subscriptionId,
                    currency: "INR",
                    status: "paid",
                    notes: values.notes || null,
                    gatewayRef: values.gatewayRef || null,
                  }),
                )}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (cents)</label>
                  <Input type="number" min={0} {...form.register("amountCents")} />
                  <p className="text-xs text-muted-foreground">Preview: {formatMoney(form.watch("amountCents") || 0)}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Method</label>
                  <Input {...form.register("method")} placeholder="cash / upi / card" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Gateway ref (optional)</label>
                  <Input {...form.register("gatewayRef")} placeholder="txn_..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea {...form.register("notes")} placeholder="Any notes…" />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={recordMut.isPending}>
                    Record
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>
            {subscriptionId ? (meta ? `${meta.total} total` : paymentsQuery.isLoading ? "Loading…" : "—") : "Select a subscription to view payments"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Paid at</th>
                  <th className="px-4 py-3 text-left font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Method</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Gateway</th>
                </tr>
              </thead>
              <tbody>
                {!subscriptionId ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                      Select a subscription above.
                    </td>
                  </tr>
                ) : paymentsQuery.isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                      Loading…
                    </td>
                  </tr>
                ) : paymentsQuery.isError ? (
                  <tr>
                    <td className="px-4 py-6 text-destructive" colSpan={5}>
                      Failed to load payments.
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/40">
                      <td className="px-4 py-3">{new Date(p.paidAt).toLocaleString()}</td>
                      <td className="px-4 py-3">{formatMoney(p.amountCents, p.currency)}</td>
                      <td className="px-4 py-3">{p.method}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{p.gatewayRef ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {subscriptionId ? (
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
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

