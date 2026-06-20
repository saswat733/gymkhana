import { useMutation, useQuery } from "@tanstack/react-query";
import * as React from "react";
import { CalendarDays, CheckCircle2, Search, UserX, Snowflake, Clock } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { listAttendance } from "../features/attendance/attendance.api";
import { verifyPass } from "../features/attendance/verifyPass.api";
import { getKpis } from "../features/stats/stats.api";

const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

type StatusFilter = "all" | "checked_in" | "qr" | "manual";

export function AttendancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [memberId, setMemberId] = React.useState("");
  const [from, setFrom] = React.useState(today);
  const [to, setTo] = React.useState(today);
  const [page, setPage] = React.useState(1);
  const [passCode, setPassCode] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const pageSize = 20;

  const kpisQ = useQuery({ queryKey: ["stats", "kpis"], queryFn: getKpis, staleTime: 15_000 });

  const verifyMut = useMutation({
    mutationFn: () => verifyPass(passCode.trim(), true),
    onSuccess: (data) => {
      toast.success(
        `${data.member.name} — ${data.subscriptionValid ? "Active member" : "No active subscription"}${data.checkedIn ? " · Checked in" : ""}`,
      );
      setPassCode("");
    },
    onError: (e: Error) => toast.error(e.message ?? "Verification failed"),
  });

  const attendanceQuery = useQuery({
    queryKey: ["attendance", { memberId, from, to, page, pageSize }],
    queryFn: () =>
      listAttendance({
        memberId: memberId.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize,
      }),
    staleTime: 10_000,
  });

  const rows = attendanceQuery.data?.attendance ?? [];
  const meta = attendanceQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const filteredRows = rows.filter((a) => {
    if (statusFilter === "checked_in") return !a.checkOutAt;
    if (statusFilter === "qr") return a.source === "qr";
    if (statusFilter === "manual") return a.source === "manual";
    return true;
  });

  const qrCount = rows.filter((a) => a.source === "qr").length;
  const manualCount = rows.filter((a) => a.source === "manual").length;
  const stillIn = rows.filter((a) => !a.checkOutAt).length;

  const summaryCards = [
    { id: "in", label: "Checked in", value: stillIn, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-500/10" },
    { id: "today", label: "Today total", value: kpisQ.data?.todayCheckIns ?? rows.length, icon: CalendarDays, tone: "text-primary bg-primary/10" },
    { id: "qr", label: "QR scans", value: qrCount, icon: CheckCircle2, tone: "text-blue-600 bg-blue-500/10" },
    { id: "manual", label: "Manual", value: manualCount, icon: Clock, tone: "text-amber-600 bg-amber-500/10" },
  ];

  const filterPills: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "checked_in", label: "Still in gym" },
    { id: "qr", label: "QR" },
    { id: "manual", label: "Manual" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">Today&apos;s flow — who&apos;s in, how they checked in, and history.</p>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by member ID…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} title="From" />
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} title="To" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map(({ id, label, value, icon: Icon, tone }) => (
          <Card key={id} className="overflow-hidden">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", tone)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{attendanceQuery.isLoading ? "…" : value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {filterPills.map((f) => (
          <Button
            key={f.id}
            variant={statusFilter === f.id ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff verify pass</CardTitle>
          <CardDescription>Backup check-in via member pass code from the mobile app.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={passCode}
            onChange={(e) => setPassCode(e.target.value)}
            placeholder="gymkhana:member:…"
            className="md:flex-1"
          />
          <Button onClick={() => verifyMut.mutate()} disabled={!passCode.trim() || verifyMut.isPending}>
            {verifyMut.isPending ? "Verifying…" : "Verify & check in"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s attendance</CardTitle>
          <CardDescription>{meta ? `${meta.total} records` : attendanceQuery.isLoading ? "Loading…" : "—"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 p-4">
          {attendanceQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : attendanceQuery.isError ? (
            <p className="text-sm text-destructive">Failed to load attendance.</p>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <UserX className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">No attendance for this filter</p>
              <p className="text-xs text-muted-foreground">Try a different date or filter.</p>
            </div>
          ) : (
            filteredRows.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      a.checkOutAt ? "bg-zinc-500/10 text-zinc-500" : "bg-emerald-500/15 text-emerald-600",
                    )}
                  >
                    {a.checkOutAt ? <Snowflake className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-medium">Member {a.memberId.slice(0, 8)}…</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(a.checkInAt)}</div>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    a.source === "qr" ? "bg-blue-500/10 text-blue-600" : "bg-zinc-500/10 text-zinc-600",
                  )}
                >
                  {a.source}
                </span>
              </div>
            ))
          )}

          {filteredRows.length > 0 ? (
            <div className="flex items-center justify-between gap-2 border-t pt-4">
              <div className="text-xs text-muted-foreground">
                Page {meta?.page ?? page} of {meta?.totalPages ?? totalPages}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
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
