import { ArrowRight, CalendarDays, CheckCircle2, CircleAlert, ReceiptIndianRupee } from "lucide-react";
import { Link } from "react-router-dom";

import { Timeline } from "../components/Timeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useOperationsCenter } from "../features/operations/useOperationsCenter";
import { cn } from "../lib/utils";

const formatMoney = (amountCents: number, currency: string) => {
  const amount = (Number(amountCents) || 0) / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
};

export function DashboardPage() {
  const { isLoading, kpis, attention, activity, upcomingRenewals } = useOperationsCenter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operations Center</h1>
        <p className="text-sm text-muted-foreground">
          What needs your attention today — then the numbers.
          {kpis?.computedAt ? ` Updated ${new Date(kpis.computedAt).toLocaleString()}` : null}
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CircleAlert className="h-5 w-5 text-primary" />
            Today&apos;s agenda
          </CardTitle>
          <CardDescription>Actions that move the gym forward</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading priorities…</p>
          ) : attention.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              All caught up — no urgent items right now.
            </div>
          ) : (
            attention.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className={cn(
                  "flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm transition-colors hover:bg-accent",
                  item.tone === "warning" && "border-amber-500/30",
                  item.tone === "info" && "border-blue-500/30",
                )}
              >
                <span className="font-medium">{item.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s check-ins</CardTitle>
            <CardDescription>Recent gym activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-3xl font-semibold">
              {isLoading ? "…" : kpis?.todayCheckIns ?? "—"}
            </div>
            <Timeline items={activity} />
            <Link to="/attendance" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
              View full attendance →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming renewals</CardTitle>
            <CardDescription>Active subscriptions ending soon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No renewals in the current window.</p>
            ) : (
              upcomingRenewals.map((s) => (
                <Link
                  key={s.id}
                  to={`/members/${s.memberId}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">Member {s.memberId.slice(0, 8)}…</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {s.endsAt}
                  </span>
                </Link>
              ))
            )}
            <Link to="/subscriptions" className="inline-flex text-sm font-medium text-primary hover:underline">
              Manage subscriptions →
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue snapshot</CardTitle>
          <CardDescription>Month-to-date performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground">Revenue MTD</div>
              <div className="mt-1 flex items-center gap-2 text-2xl font-semibold">
                <ReceiptIndianRupee className="h-5 w-5 text-muted-foreground" />
                {isLoading || !kpis ? "—" : formatMoney(kpis.revenueMtdCents, kpis.currency || "INR")}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground">Active members</div>
              <div className="mt-1 text-2xl font-semibold">{isLoading ? "…" : kpis?.activeSubscriptions ?? "—"}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground">Expiring in 7 days</div>
              <div className="mt-1 text-2xl font-semibold">{isLoading ? "…" : kpis?.expiringSoon ?? "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
