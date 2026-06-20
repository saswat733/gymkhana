import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Dumbbell,
  FileText,
  LayoutList,
  StickyNote,
  Ticket,
} from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { Timeline, type TimelineItem } from "../components/Timeline";
import { buttonVariants } from "../components/ui/button";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { listAttendance } from "../features/attendance/attendance.api";
import { listMemberInvoices } from "../features/invoices/memberInvoices.api";
import { getMember } from "../features/members/members.api";
import {
  createMemberNote,
  deleteMemberNote,
  listMemberNotes,
  type StaffNote,
} from "../features/members/memberNotes.api";
import { listPayments } from "../features/payments/payments.api";
import { listPlans } from "../features/plans/plans.api";
import { listSubscriptions } from "../features/subscriptions/subscriptions.api";
import { listWorkoutPlans } from "../features/workoutPlans/workoutPlans.api";
import { StatusBadge } from "../lib/status";
import { cn } from "../lib/utils";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutList },
  { id: "subscriptions", label: "Subscriptions", icon: Ticket },
  { id: "attendance", label: "Attendance", icon: CalendarDays },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "workouts", label: "Workout plans", icon: Dumbbell },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "activity", label: "Activity", icon: LayoutList },
] as const;

type TabId = (typeof tabs)[number]["id"];

const formatMoney = (cents: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format((Number(cents) || 0) / 100);

function daysRemaining(endsAt: string): number | null {
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

export function MemberWorkspacePage() {
  const { id = "" } = useParams();
  const [tab, setTab] = React.useState<TabId>("overview");

  const memberQ = useQuery({ queryKey: ["member", id], queryFn: () => getMember(id), enabled: Boolean(id) });
  const subsQ = useQuery({
    queryKey: ["subscriptions", { memberId: id }],
    queryFn: () => listSubscriptions({ memberId: id, pageSize: 50 }),
    enabled: Boolean(id),
  });
  const attendanceQ = useQuery({
    queryKey: ["attendance", { memberId: id }],
    queryFn: () => listAttendance({ memberId: id, pageSize: 30 }),
    enabled: Boolean(id),
  });
  const workoutsQ = useQuery({
    queryKey: ["workout-plans", { memberId: id }],
    queryFn: () => listWorkoutPlans({ memberId: id }),
    enabled: Boolean(id),
  });
  const plansQ = useQuery({ queryKey: ["plans", "all"], queryFn: () => listPlans({ pageSize: 100 }) });
  const invoicesQ = useQuery({ queryKey: ["member-invoices"], queryFn: listMemberInvoices });

  const activeSub = (subsQ.data?.subscriptions ?? []).find((s) => s.status === "active");
  const primarySubId = activeSub?.id ?? subsQ.data?.subscriptions?.[0]?.id;

  const paymentsQ = useQuery({
    queryKey: ["payments", { subscriptionId: primarySubId }],
    queryFn: () => listPayments({ subscriptionId: primarySubId!, pageSize: 50 }),
    enabled: Boolean(primarySubId),
  });

  const member = memberQ.data;
  const planName = activeSub
    ? plansQ.data?.plans.find((p) => p.id === activeSub.planId)?.name ?? activeSub.planId.slice(0, 8)
    : null;
  const daysLeft = activeSub ? daysRemaining(activeSub.endsAt) : null;

  const activityItems: TimelineItem[] = React.useMemo(() => {
    const items: TimelineItem[] = [];
    for (const a of attendanceQ.data?.attendance ?? []) {
      items.push({
        id: `att-${a.id}`,
        time: new Date(a.checkInAt).toLocaleString(),
        title: "Checked in",
        description: `Source: ${a.source}`,
        tone: "success",
      });
    }
    for (const s of subsQ.data?.subscriptions ?? []) {
      items.push({
        id: `sub-${s.id}`,
        time: new Date(s.createdAt).toLocaleDateString(),
        title: `Subscription ${s.status}`,
        description: `${s.startsAt} → ${s.endsAt}`,
        tone: s.status === "active" ? "info" : "default",
      });
    }
    return items.sort((a, b) => (a.time < b.time ? 1 : -1)).slice(0, 20);
  }, [attendanceQ.data, subsQ.data]);

  const memberInvoices = (invoicesQ.data ?? []).filter(
    (inv) => inv.buyerName.toLowerCase() === (member?.User?.name ?? "").toLowerCase(),
  );

  if (memberQ.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading member workspace…</div>;
  }

  if (memberQ.isError || !member) {
    return (
      <div className="space-y-4">
        <Link to="/members" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to members
        </Link>
        <p className="text-destructive">Member not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/members" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 inline-flex items-center")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Members
      </Link>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
            {(member.User?.name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{member.User?.name}</h1>
            <p className="text-sm text-muted-foreground">{member.User?.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={member.isActive ? "active" : "inactive"} label={member.isActive ? "Active" : "Inactive"} />
              {activeSub ? <StatusBadge status={activeSub.status} /> : <StatusBadge status="expired" label="No subscription" />}
              {daysLeft !== null ? (
                <span className="text-xs text-muted-foreground">
                  {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft} days remaining`}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/subscriptions" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Assign plan
          </Link>
          <Link to="/payments" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Record payment
          </Link>
          <Link to="/attendance" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Check in
          </Link>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b pb-px">
        {tabs.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setTab(tabId)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
              tab === tabId
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Membership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{planName ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span>{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{member.User?.phone ?? "—"}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={activityItems.slice(0, 5)} />
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "subscriptions" && (
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
            <CardDescription>All membership periods for this member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(subsQ.data?.subscriptions ?? []).length === 0 ? (
              <EmptyState
                title="No subscriptions"
                description="Assign a plan to activate this member's membership."
                actionLabel="Assign plan"
                actionTo="/subscriptions"
              />
            ) : (
              subsQ.data!.subscriptions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">
                      {plansQ.data?.plans.find((p) => p.id === s.planId)?.name ?? s.planId.slice(0, 8)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.startsAt} → {s.endsAt}
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === "attendance" && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {(attendanceQ.data?.attendance ?? []).length === 0 ? (
              <EmptyState title="No check-ins yet" description="Attendance will appear here after the member visits the gym." />
            ) : (
              <Timeline
                items={(attendanceQ.data?.attendance ?? []).map((a) => ({
                  id: a.id,
                  time: new Date(a.checkInAt).toLocaleString(),
                  title: "Checked in",
                  description: a.checkOutAt ? `Checked out ${new Date(a.checkOutAt).toLocaleString()}` : `Source: ${a.source}`,
                  tone: "success",
                }))}
              />
            )}
          </CardContent>
        </Card>
      )}

      {tab === "payments" && (
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!primarySubId ? (
              <EmptyState title="No subscription" description="Create a subscription before recording payments." actionTo="/subscriptions" actionLabel="Assign plan" />
            ) : (paymentsQ.data?.payments ?? []).length === 0 ? (
              <EmptyState title="No payments" description="Record the first payment for this member." actionTo="/payments" actionLabel="Record payment" />
            ) : (
              paymentsQ.data!.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">{formatMoney(p.amountCents, p.currency)}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.method} · {new Date(p.paidAt).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === "invoices" && (
        <Card>
          <CardHeader>
            <CardTitle>GST invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberInvoices.length === 0 ? (
              <EmptyState title="No invoices" description="Invoices are generated from recorded payments." actionTo="/invoices" actionLabel="View invoices" />
            ) : (
              memberInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">{inv.invoiceNumber}</div>
                    <div className="text-xs text-muted-foreground">{new Date(inv.issuedAt).toLocaleDateString()}</div>
                  </div>
                  <span className="font-medium">{formatMoney(inv.totalCents, inv.currency)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === "workouts" && (
        <Card>
          <CardHeader>
            <CardTitle>Workout plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(workoutsQ.data ?? []).length === 0 ? (
              <EmptyState
                title="No workouts assigned"
                description="Assign a workout plan to help this member stay engaged."
                actionTo="/workout-plans"
                actionLabel="Assign workout"
              />
            ) : (
              workoutsQ.data!.map((w) => (
                <div key={w.id} className="rounded-lg border px-4 py-3 text-sm">
                  <div className="font-medium">{w.title}</div>
                  {w.notes ? <div className="text-muted-foreground">{w.notes}</div> : null}
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === "notes" && (
        <MemberNotesPanel memberId={id} />
      )}

      {tab === "activity" && (
        <Card>
          <CardHeader>
            <CardTitle>Activity timeline</CardTitle>
            <CardDescription>Full history for this member</CardDescription>
          </CardHeader>
          <CardContent>
            <Timeline items={activityItems} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MemberNotesPanel({ memberId }: { memberId: string }) {
  const qc = useQueryClient();
  const [draft, setDraft] = React.useState("");

  const notesQ = useQuery({
    queryKey: ["member-notes", memberId],
    queryFn: () => listMemberNotes(memberId),
    enabled: Boolean(memberId),
  });

  const createM = useMutation({
    mutationFn: () => createMemberNote({ memberId, body: draft }),
    onSuccess: async () => {
      setDraft("");
      await qc.invalidateQueries({ queryKey: ["member-notes", memberId] });
    },
  });

  const deleteM = useMutation({
    mutationFn: (noteId: string) => deleteMemberNote({ memberId, noteId }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["member-notes", memberId] });
    },
  });

  const notes = notesQ.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>Internal notes for reception and trainers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="e.g. Has knee injury. Prefers evening batch."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
          />
          <Button
            type="button"
            disabled={!draft.trim() || createM.isPending}
            onClick={() => createM.mutate()}
          >
            {createM.isPending ? "Saving…" : "Add note"}
          </Button>
        </div>

        {notesQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading notes…</p>
        ) : notes.length === 0 ? (
          <EmptyState title="No notes yet" description="Add context staff should see at check-in." />
        ) : (
          <ul className="space-y-3">
            {notes.map((n: StaffNote) => (
              <li key={n.id} className="rounded-lg border px-4 py-3 text-sm">
                <p className="whitespace-pre-wrap">{n.body}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {n.author?.name ?? "Staff"} · {new Date(n.createdAt).toLocaleString()}
                    {n.pinned ? " · Pinned" : ""}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive"
                    disabled={deleteM.isPending}
                    onClick={() => deleteM.mutate(n.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
