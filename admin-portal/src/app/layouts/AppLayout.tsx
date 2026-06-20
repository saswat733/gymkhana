import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  ReceiptIndianRupee,
  Search,
  Settings,
  Tags,
  Target,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import * as React from "react";

import { CommandPalette } from "../../components/CommandPalette";
import { QuickActionFab } from "../../components/QuickActionFab";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../lib/authStore";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: readonly string[];
};

type NavGroup = {
  label: string | null;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { to: "/dashboard", label: "Operations Center", icon: LayoutDashboard, roles: ["owner", "admin", "manager", "trainer", "receptionist"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/members", label: "Members", icon: Users, roles: ["owner", "admin", "manager", "trainer", "receptionist"] },
      { to: "/attendance", label: "Attendance", icon: CalendarDays, roles: ["owner", "admin", "manager", "trainer", "receptionist"] },
      { to: "/payments", label: "Payments", icon: ReceiptIndianRupee, roles: ["owner", "admin", "manager", "trainer", "receptionist"] },
      { to: "/subscriptions", label: "Subscriptions", icon: Ticket, roles: ["owner", "admin", "manager", "trainer", "receptionist"] },
    ],
  },
  {
    label: "Growth",
    items: [
      { to: "/leads", label: "Leads", icon: Target, roles: ["owner", "admin", "manager", "receptionist"] },
      { to: "/retention", label: "Retention", icon: Bell, roles: ["owner", "admin", "manager"] },
      { to: "/announcements", label: "Announcements", icon: Bell, roles: ["owner", "admin", "manager"] },
    ],
  },
  {
    label: "Fitness",
    items: [
      { to: "/trainers", label: "Trainers", icon: UserCog, roles: ["owner", "admin", "manager"] },
      { to: "/workout-plans", label: "Workout plans", icon: ClipboardList, roles: ["owner", "admin", "manager", "trainer"] },
    ],
  },
  {
    label: "Insights",
    items: [{ to: "/analytics", label: "Analytics", icon: BarChart3, roles: ["owner", "admin", "manager", "trainer"] }],
  },
  {
    label: "Platform",
    items: [
      { to: "/plans", label: "Plans", icon: Tags, roles: ["owner", "admin", "manager", "trainer"] },
      { to: "/invoices", label: "GST Invoices", icon: ReceiptIndianRupee, roles: ["owner", "admin", "manager"] },
      { to: "/attendance-setup", label: "QR Setup", icon: QrCode, roles: ["owner", "admin", "manager"] },
      { to: "/billing", label: "Billing", icon: CreditCard, roles: ["owner", "admin"] },
      { to: "/settings", label: "Settings", icon: Settings, roles: ["owner", "admin", "manager", "trainer", "receptionist"] },
    ],
  },
];

export function AppLayout() {
  const clear = useAuthStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const role = user?.role;
  const visibleGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => !role || item.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="min-h-dvh bg-background">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r bg-card p-4 transition-transform lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">GymKhana</div>
              <div className="text-xs text-muted-foreground">Admin Portal</div>
            </div>
          </div>

          <nav className="mt-4 flex-1 space-y-5 overflow-y-auto">
            {visibleGroups.map((group) => (
              <div key={group.label ?? "home"}>
                {group.label ? (
                  <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                ) : null}
                <div className="space-y-0.5">
                  {group.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="pt-4">
            <div className="rounded-lg border bg-background p-3">
              <div className="text-xs text-muted-foreground">Signed in as</div>
              <div className="mt-1 truncate text-sm font-medium">{user?.name ?? "—"}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</div>
              <Button variant="outline" className="mt-3 w-full justify-start" onClick={() => clear()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
            <div className="flex h-14 items-center gap-2 px-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen((v) => !v)}>
                <Menu className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-9 flex-1 max-w-md justify-start gap-2 text-muted-foreground sm:flex"
                onClick={() => setPaletteOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search members, leads, plans…</span>
                <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] md:inline">Ctrl K</kbd>
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setPaletteOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4 pb-24 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      <QuickActionFab />

      {sidebarOpen ? (
        <button
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}
    </div>
  );
}
