import { CreditCard, Plus, Target, Ticket, UserPlus, X } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const actions = [
  { to: "/members", label: "Add member", icon: UserPlus },
  { to: "/leads", label: "Create lead", icon: Target },
  { to: "/payments", label: "Record payment", icon: CreditCard },
  { to: "/subscriptions", label: "Assign plan", icon: Ticket },
  { to: "/attendance", label: "Check in member", icon: Plus },
];

export function QuickActionFab() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open ? (
        <div className="mb-1 flex flex-col items-end gap-2">
          {actions.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-lg transition hover:bg-accent"
            >
              {label}
              <Icon className="h-4 w-4" />
            </Link>
          ))}
        </div>
      ) : null}
      <Button
        size="icon"
        className={cn("h-14 w-14 rounded-full shadow-lg", open && "rotate-45")}
        onClick={() => setOpen((v) => !v)}
        aria-label="Quick actions"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}
