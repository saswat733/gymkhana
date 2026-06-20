import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, unwrap } from "../lib/api";

type Rule = {
  id: string;
  name: string;
  triggerType: string;
  triggerDays: number;
  actionType: string;
  messageTemplate: string | null;
  isActive: boolean;
};

export function RetentionPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("No visit reminder");

  const rulesQ = useQuery({
    queryKey: ["retention-rules"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: { rules: Rule[] } }>("/retention-rules");
      return unwrap(res.data).rules;
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await api.post("/retention-rules", {
        name,
        triggerType: "no_attendance_days",
        triggerDays: 5,
        actionType: "push",
        messageTemplate: "We miss you! Come back to the gym today.",
      });
      return unwrap(res.data);
    },
    onSuccess: () => {
      toast.success("Rule created");
      qc.invalidateQueries({ queryKey: ["retention-rules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runMut = useMutation({
    mutationFn: async () => {
      const res = await api.post("/retention-rules/run");
      return unwrap(res.data);
    },
    onSuccess: () => toast.success("Retention rules executed"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Retention automation</h1>
        <p className="text-sm text-muted-foreground">Rule-based push, email, and staff alerts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick rule</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={() => createMut.mutate()}>Add no-visit rule (5 days)</Button>
          <Button variant="outline" onClick={() => runMut.mutate()} disabled={runMut.isPending}>
            Run all rules now
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Trigger</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {(rulesQ.data ?? []).map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2">
                    {r.triggerType} ({r.triggerDays}d)
                  </td>
                  <td className="px-4 py-2">{r.actionType}</td>
                  <td className="px-4 py-2">{r.isActive ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
