import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";

import { listLeads } from "../features/leads/leads.api";
import { listMembers } from "../features/members/members.api";
import { listPlans } from "../features/plans/plans.api";
import { listTrainers } from "../features/trainers/trainers.api";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

type Result = { id: string; label: string; sub?: string; to: string; group: string };

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState(0);

  const membersQ = useQuery({ queryKey: ["cmd", "members", q], queryFn: () => listMembers({ q, pageSize: 20 }), enabled: open && q.length >= 1 });
  const leadsQ = useQuery({ queryKey: ["cmd", "leads", q], queryFn: () => listLeads({ q }), enabled: open && q.length >= 1 });
  const plansQ = useQuery({ queryKey: ["cmd", "plans"], queryFn: () => listPlans({ pageSize: 50 }), enabled: open });
  const trainersQ = useQuery({ queryKey: ["cmd", "trainers"], queryFn: () => listTrainers({ pageSize: 50 }), enabled: open });

  const staticNav: Result[] = [
    { id: "nav-members", label: "Members", to: "/members", group: "Navigate" },
    { id: "nav-leads", label: "Leads", to: "/leads", group: "Navigate" },
    { id: "nav-payments", label: "Payments", to: "/payments", group: "Navigate" },
    { id: "nav-attendance", label: "Attendance", to: "/attendance", group: "Navigate" },
    { id: "nav-billing", label: "Billing", to: "/billing", group: "Navigate" },
    { id: "nav-qr", label: "QR Setup", to: "/attendance-setup", group: "Navigate" },
  ];

  const results = React.useMemo(() => {
    const items: Result[] = [];
    const needle = q.trim().toLowerCase();

    if (!needle) return staticNav;

    for (const n of staticNav) {
      if (n.label.toLowerCase().includes(needle)) items.push(n);
    }

    for (const m of membersQ.data?.members ?? []) {
      items.push({
        id: `m-${m.id}`,
        label: m.User?.name ?? "Member",
        sub: m.User?.email ?? undefined,
        to: `/members/${m.id}`,
        group: "Members",
      });
    }

    for (const l of leadsQ.data ?? []) {
      if (!l.name.toLowerCase().includes(needle) && !(l.email ?? "").toLowerCase().includes(needle)) continue;
      items.push({ id: `l-${l.id}`, label: l.name, sub: l.status, to: "/leads", group: "Leads" });
    }

    for (const p of plansQ.data?.plans ?? []) {
      if (p.name.toLowerCase().includes(needle)) {
        items.push({ id: `p-${p.id}`, label: p.name, sub: "Plan", to: "/plans", group: "Plans" });
      }
    }

    for (const t of trainersQ.data ?? []) {
      const name = t.User?.name ?? "Trainer";
      if (name.toLowerCase().includes(needle)) {
        items.push({ id: `t-${t.id}`, label: name, sub: "Trainer", to: "/trainers", group: "Trainers" });
      }
    }

    return items.slice(0, 12);
  }, [q, membersQ.data, leadsQ.data, plansQ.data, trainersQ.data]);

  React.useEffect(() => setActive(0), [q]);

  function go(to: string) {
    navigate(to);
    onOpenChange(false);
    setQ("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search members, leads, plans…"
            className="border-0 shadow-none focus-visible:ring-0"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === "Enter" && results[active]) go(results[active].to);
            }}
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">No results</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                type="button"
                className={cn(
                  "flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  i === active ? "bg-accent text-accent-foreground" : "hover:bg-muted/60",
                )}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.to)}
              >
                <span className="font-medium">{r.label}</span>
                <span className="text-xs text-muted-foreground">
                  {r.group}
                  {r.sub ? ` · ${r.sub}` : ""}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
