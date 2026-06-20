import { useQuery } from "@tanstack/react-query";

import { listAttendance } from "../attendance/attendance.api";
import { listLeads } from "../leads/leads.api";
import { getKpis } from "../stats/stats.api";
import { listSubscriptions } from "../subscriptions/subscriptions.api";
import type { TimelineItem } from "../../components/Timeline";

export function useOperationsCenter() {
  const kpisQ = useQuery({ queryKey: ["stats", "kpis"], queryFn: getKpis, staleTime: 15_000 });
  const leadsQ = useQuery({
    queryKey: ["leads", "ops"],
    queryFn: () => listLeads({ status: "trial_scheduled" }),
    staleTime: 30_000,
  });
  const followUpsQ = useQuery({
    queryKey: ["leads", "followups"],
    queryFn: () => listLeads({ status: "created" }),
    staleTime: 30_000,
  });
  const subsQ = useQuery({
    queryKey: ["subscriptions", "expiring"],
    queryFn: () => listSubscriptions({ status: "active", pageSize: 50 }),
    staleTime: 30_000,
  });
  const attendanceQ = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => {
      const today = new Date().toISOString().slice(0, 10);
      return listAttendance({ from: today, to: today, pageSize: 10 });
    },
    staleTime: 15_000,
  });

  const kpis = kpisQ.data;
  const trialLeads = leadsQ.data?.length ?? 0;
  const newLeads = followUpsQ.data?.length ?? 0;

  const attention = [
    kpis?.expiringSoon
      ? { id: "exp", label: `${kpis.expiringSoon} memberships expiring soon`, to: "/subscriptions", tone: "warning" as const }
      : null,
    trialLeads > 0
      ? { id: "trial", label: `${trialLeads} trial users awaiting follow-up`, to: "/leads", tone: "info" as const }
      : null,
    newLeads > 0
      ? { id: "leads", label: `${newLeads} new leads need follow-up`, to: "/leads", tone: "info" as const }
      : null,
  ].filter(Boolean) as { id: string; label: string; to: string; tone: "warning" | "info" }[];

  const activity: TimelineItem[] = (attendanceQ.data?.attendance ?? []).slice(0, 8).map((a) => ({
    id: a.id,
    time: new Date(a.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    title: "Member checked in",
    description: `Member ${a.memberId.slice(0, 8)}… · ${a.source}`,
    tone: "success" as const,
  }));

  return {
    isLoading: kpisQ.isLoading,
    kpis,
    attention,
    activity,
    upcomingRenewals: (subsQ.data?.subscriptions ?? []).slice(0, 5),
  };
}
