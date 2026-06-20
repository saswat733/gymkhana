import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { createLead, listLeads, updateLead, type Lead } from "../features/leads/leads.api";
import { listPlans } from "../features/plans/plans.api";
import { startLeadTrial } from "../features/leads/leads.api";

const STATUS_OPTIONS: Lead["status"][] = ["created", "trial_scheduled", "trial_completed", "converted", "lost"];

export function LeadsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [filter, setFilter] = useState("");

  const leadsQ = useQuery({ queryKey: ["leads", filter], queryFn: () => listLeads({ status: filter || undefined }) });
  const plansQ = useQuery({ queryKey: ["plans", "trials"], queryFn: () => listPlans({ page: 1, pageSize: 100 }) });

  const trialPlans = (plansQ.data?.plans ?? []).filter((p) => (p as { isTrial?: boolean }).isTrial);

  const createMut = useMutation({
    mutationFn: () => createLead({ name, phone: phone || null, email: email || null, source: "walk-in" }),
    onSuccess: async () => {
      toast.success("Lead created");
      setName("");
      setPhone("");
      setEmail("");
      await qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lead["status"] }) => updateLead(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  const trialMut = useMutation({
    mutationFn: ({ id, planId }: { id: string; planId: string }) => startLeadTrial(id, planId),
    onSuccess: () => {
      toast.success("Trial started (member account required)");
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads CRM</h1>
        <p className="text-sm text-muted-foreground">Track prospects from first contact to conversion.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New lead</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={() => createMut.mutate()} disabled={!name.trim()}>
            Add lead
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant={filter === "" ? "default" : "outline"} size="sm" onClick={() => setFilter("")}>
          All
        </Button>
        {STATUS_OPTIONS.map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(leadsQ.data ?? []).map((lead) => (
                <tr key={lead.id} className="border-b">
                  <td className="px-4 py-2 font-medium">{lead.name}</td>
                  <td className="px-4 py-2">
                    {lead.phone ?? "—"}
                    <br />
                    <span className="text-xs text-muted-foreground">{lead.email ?? ""}</span>
                  </td>
                  <td className="px-4 py-2">{lead.status}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {trialPlans[0] ? (
                        <Button size="sm" variant="outline" onClick={() => trialMut.mutate({ id: lead.id, planId: trialPlans[0].id })}>
                          Start trial
                        </Button>
                      ) : null}
                      {STATUS_OPTIONS.filter((s) => s !== lead.status).map((s) => (
                        <Button key={s} size="sm" variant="ghost" onClick={() => statusMut.mutate({ id: lead.id, status: s })}>
                          → {s}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
