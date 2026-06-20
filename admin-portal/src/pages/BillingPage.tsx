import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  cancelSaasSubscription,
  generateSaasInvoice,
  getSaasSubscription,
  listSaasInvoices,
  listSaasPlans,
  createSaasRazorpayOrder,
  markSaasInvoicePaid,
  startSaasSubscription,
  type SaasPlan,
} from "../features/saas/saas.api";
import { getMrrMetrics } from "../features/stats/stats.api";
import { listTrainers } from "../features/trainers/trainers.api";
import { StatusBadge } from "../lib/status";
import { cn } from "../lib/utils";

const formatMoney = (cents: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format((cents || 0) / 100);

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const statusLabel: Record<string, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  cancelled: "Cancelled",
  issued: "Issued",
  paid: "Paid",
  draft: "Draft",
  void: "Void",
};

export function BillingPage() {
  const qc = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plansQ = useQuery({ queryKey: ["saas", "plans"], queryFn: listSaasPlans });
  const subQ = useQuery({ queryKey: ["saas", "subscription"], queryFn: getSaasSubscription });
  const invQ = useQuery({ queryKey: ["saas", "invoices"], queryFn: listSaasInvoices });
  const mrrQ = useQuery({ queryKey: ["stats", "mrr"], queryFn: getMrrMetrics });
  const trainersQ = useQuery({ queryKey: ["trainers", "billing"], queryFn: () => listTrainers({ pageSize: 100 }) });

  const startMut = useMutation({
    mutationFn: (planCode: string) => startSaasSubscription({ planCode, billingCycle, trialDays: 14 }),
    onSuccess: async () => {
      toast.success("Subscription started");
      await qc.invalidateQueries({ queryKey: ["saas"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });

  const cancelMut = useMutation({
    mutationFn: cancelSaasSubscription,
    onSuccess: async () => {
      toast.success("Subscription cancelled");
      await qc.invalidateQueries({ queryKey: ["saas"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });

  const genInvMut = useMutation({
    mutationFn: () => generateSaasInvoice({ gstPercent: 18 }),
    onSuccess: async () => {
      toast.success("Invoice generated");
      await qc.invalidateQueries({ queryKey: ["saas", "invoices"] });
      await qc.invalidateQueries({ queryKey: ["saas", "subscription"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });

  const paidMut = useMutation({
    mutationFn: markSaasInvoicePaid,
    onSuccess: async () => {
      toast.success("Invoice marked paid");
      await qc.invalidateQueries({ queryKey: ["saas", "invoices"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });

  const razorpayMut = useMutation({
    mutationFn: async (invoiceId: string) => {
      const rz = await createSaasRazorpayOrder(invoiceId);
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) throw new Error("Razorpay checkout could not load");
      return new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: rz.keyId,
          amount: rz.amount,
          currency: rz.currency,
          order_id: rz.orderId,
          name: "GymKhana",
          description: "Platform subscription",
          handler: () => {
            toast.success("Payment submitted — status updates via webhook");
            void qc.invalidateQueries({ queryKey: ["saas"] });
            resolve();
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        rzp.open();
      });
    },
    onError: (e: Error) => toast.error(e.message ?? "Payment failed"),
  });

  const sub = subQ.data;
  const plans = plansQ.data ?? [];
  const invoices = invQ.data ?? [];
  const plan = sub?.SaasPlan;
  const memberCount = mrrQ.data?.totalMembers ?? 0;
  const trainerCount = (trainersQ.data ?? []).filter((t) => t.isActive).length;
  const memberLimit = plan?.limitMembers;
  const trainerLimit = plan?.limitTrainers;

  const usageBar = (used: number, limit: number | null | undefined, label: string) => {
    const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">
            {used}
            {limit ? ` / ${limit}` : " (unlimited)"}
          </span>
        </div>
        {limit ? (
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-amber-500" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}
      </div>
    );
  };

  const priceFor = (p: SaasPlan) =>
    billingCycle === "yearly" ? p.priceYearlyCents : p.priceMonthlyCents;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform billing</h1>
        <p className="text-sm text-muted-foreground">Your gym&apos;s subscription to GymKhana (SaaS).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current subscription</CardTitle>
          <CardDescription>Trial, plan, and billing cycle for this gym.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {subQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : !sub ? (
            <div className="text-sm text-muted-foreground">No subscription yet. Pick a plan below to start a trial.</div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Plan</div>
                  <div className="font-medium">{sub.SaasPlan?.name ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <StatusBadge status={sub.status} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Billing cycle</div>
                  <div className="font-medium capitalize">{sub.billingCycle}</div>
                </div>
                {sub.trialEndsAt ? (
                  <div>
                    <div className="text-xs text-muted-foreground">Trial ends</div>
                    <div className="font-medium">{new Date(sub.trialEndsAt).toLocaleDateString()}</div>
                  </div>
                ) : null}
                {sub.currentPeriodEndsAt ? (
                  <div>
                    <div className="text-xs text-muted-foreground">Renewal date</div>
                    <div className="font-medium">{new Date(sub.currentPeriodEndsAt).toLocaleDateString()}</div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <div className="text-sm font-medium">Usage</div>
                {usageBar(memberCount, memberLimit, "Members")}
                {usageBar(trainerCount, trainerLimit, "Trainers")}
              </div>
            </div>
          )}

          {sub && sub.status !== "cancelled" ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" onClick={() => genInvMut.mutate()} disabled={genInvMut.isPending}>
                {genInvMut.isPending ? "Generating…" : "Generate invoice"}
              </Button>
              <Button variant="destructive" onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>
                Cancel subscription
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>Basic, Pro, and Enterprise — billed monthly or yearly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={billingCycle === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === "yearly" ? "default" : "outline"}
              size="sm"
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <Card key={p.id} className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-semibold">{formatMoney(priceFor(p))}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.limitMembers ? `Up to ${p.limitMembers} members` : "Unlimited members"}
                    {p.limitTrainers ? ` · ${p.limitTrainers} trainers` : ""}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => startMut.mutate(p.code)}
                    disabled={startMut.isPending}
                  >
                    {sub?.SaasPlan?.code === p.code ? "Switch to this plan" : "Start trial"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Platform invoices (GST-ready). Pay with Razorpay or mark paid after bank/UPI transfer.</CardDescription>
        </CardHeader>
        <CardContent>
          {invQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : invoices.length === 0 ? (
            <div className="text-sm text-muted-foreground">No invoices yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Number</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">Issued</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b">
                      <td className="py-2 pr-4 font-medium">{inv.invoiceNumber}</td>
                      <td className="py-2 pr-4">{statusLabel[inv.status] ?? inv.status}</td>
                      <td className="py-2 pr-4">{formatMoney(inv.totalCents, inv.currency)}</td>
                      <td className="py-2 pr-4">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        {inv.status === "issued" ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => razorpayMut.mutate(inv.id)}
                              disabled={razorpayMut.isPending}
                            >
                              Pay (Razorpay)
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => paidMut.mutate(inv.id)}
                              disabled={paidMut.isPending}
                            >
                              Mark paid
                            </Button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
