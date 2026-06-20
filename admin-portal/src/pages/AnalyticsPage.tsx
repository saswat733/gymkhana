import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { getMrrMetrics } from "../features/stats/stats.api";
import { api, unwrap } from "../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: unknown }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

type RevenueTrend = {
  days: number;
  currency: string;
  series: { day: string; revenueCents: number }[];
};

type Heatmap = {
  days: number;
  series: { day: string; count: number }[];
};

const formatMoney = (cents: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format((Number(cents) || 0) / 100);

export function AnalyticsPage() {
  const mrrQuery = useQuery({
    queryKey: ["stats", "mrr"],
    queryFn: getMrrMetrics,
    staleTime: 30_000,
  });

  const revenueQuery = useQuery({
    queryKey: ["stats", "revenue-trend", 30],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ trend: RevenueTrend }>>("/stats/revenue-trend", { params: { days: 30 } });
      return unwrap(res.data).trend;
    },
    staleTime: 30_000,
  });

  const heatQuery = useQuery({
    queryKey: ["stats", "attendance-heatmap", 56],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ heatmap: Heatmap }>>("/stats/attendance-heatmap", { params: { days: 56 } });
      return unwrap(res.data).heatmap;
    },
    staleTime: 30_000,
  });

  const trend = revenueQuery.data;
  const heat = heatQuery.data;
  const mrr = mrrQuery.data;

  const max = Math.max(...(heat?.series?.map((x) => x.count) ?? [0]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">MRR, retention, revenue trend, and attendance activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>MRR</CardDescription>
            <CardTitle className="text-2xl">
              {mrrQuery.isLoading ? "…" : formatMoney(mrr?.mrrCents ?? 0, mrr?.currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            ARR {mrrQuery.isLoading ? "…" : formatMoney(mrr?.arrCents ?? 0, mrr?.currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active subscriptions</CardDescription>
            <CardTitle className="text-2xl">{mrrQuery.isLoading ? "…" : (mrr?.activeSubscriptions ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {mrr?.totalMembers ?? 0} total members
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Renewal rate (MTD)</CardDescription>
            <CardTitle className="text-2xl">
              {mrrQuery.isLoading ? "…" : `${mrr?.renewalRatePercent ?? 0}%`}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {mrr?.renewalsThisMonth ?? 0} renewals this month
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Payments (MTD)</CardDescription>
            <CardTitle className="text-2xl">{mrrQuery.isLoading ? "…" : (mrr?.paymentsThisMonth ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Paid member payments</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue (last 30 days)</CardTitle>
            <CardDescription>Sum of paid payments per day.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {revenueQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : revenueQuery.isError || !trend ? (
              <div className="text-sm text-destructive">Failed to load revenue trend.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend.series} margin={{ left: 8, right: 8, top: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} minTickGap={24} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                  <Tooltip formatter={(v: any) => formatMoney(Number(v), trend.currency)} />
                  <Area type="monotone" dataKey="revenueCents" stroke="hsl(var(--primary))" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance heatmap (last 8 weeks)</CardTitle>
            <CardDescription>Daily check-ins count.</CardDescription>
          </CardHeader>
          <CardContent>
            {heatQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : heatQuery.isError || !heat ? (
              <div className="text-sm text-destructive">Failed to load attendance heatmap.</div>
            ) : (
              <div className="grid grid-cols-14 gap-1">
                {heat.series.map((d) => {
                  const intensity = max ? d.count / max : 0;
                  const bg = `rgba(124, 58, 237, ${0.08 + intensity * 0.6})`;
                  return (
                    <div
                      key={d.day}
                      title={`${d.day}: ${d.count}`}
                      className="h-5 w-5 rounded"
                      style={{ background: bg }}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

