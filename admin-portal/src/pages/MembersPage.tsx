import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { Link } from "react-router-dom";
import { Search, UserPlus, UserRoundCheck, UserRoundX } from "lucide-react";

import { EmptyState } from "../components/EmptyState";
import { Button, buttonVariants } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { listMembers, setMemberActive } from "../features/members/members.api";
import { StatusBadge } from "../lib/status";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export function MembersPage() {
  const qc = useQueryClient();
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const membersQuery = useQuery({
    queryKey: ["members", { q, page, pageSize }],
    queryFn: () => listMembers({ q: q || undefined, page, pageSize }),
    staleTime: 10_000,
  });

  const toggleActive = useMutation({
    mutationFn: setMemberActive,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member updated");
    },
  });

  const rows = membersQuery.data?.members ?? [];
  const meta = membersQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">Open any member to view their full workspace.</p>
        </div>

        <div className="flex w-full gap-2 md:w-[420px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, phone…"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member list</CardTitle>
          <CardDescription>
            {meta ? `${meta.total} total` : membersQuery.isLoading ? "Loading…" : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {membersQuery.isLoading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Loading…</div>
          ) : membersQuery.isError ? (
            <div className="px-4 py-6 text-sm text-destructive">Failed to load members.</div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={UserPlus}
                title="No members yet"
                description="Add your first member to start managing memberships and attendance."
                actionLabel="Go to subscriptions"
                actionTo="/subscriptions"
              />
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr key={m.id} className="border-b hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <Link to={`/members/${m.id}`} className="group">
                          <div className="font-medium group-hover:text-primary">{m.User?.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">Open workspace →</div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">{m.User?.email ?? "—"}</td>
                      <td className="px-4 py-3">{m.User?.phone ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={m.isActive ? "active" : "inactive"} label={m.isActive ? "Active" : "Inactive"} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/members/${m.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                            Open
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={toggleActive.isPending}
                            onClick={() => toggleActive.mutate({ id: m.id, isActive: !m.isActive })}
                          >
                            {m.isActive ? (
                              <>
                                <UserRoundX className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserRoundCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 0 ? (
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
