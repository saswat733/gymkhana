import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./app/layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { MembersPage } from "./pages/MembersPage";
import { MemberWorkspacePage } from "./pages/MemberWorkspacePage";
import { PlansPage } from "./pages/PlansPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { AttendancePage } from "./pages/AttendancePage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { BillingPage } from "./pages/BillingPage";
import { TrainersPage } from "./pages/TrainersPage";
import { WorkoutPlansPage } from "./pages/WorkoutPlansPage";
import { OnboardPage } from "./pages/OnboardPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { AttendanceSetupPage } from "./pages/AttendanceSetupPage";
import { LeadsPage } from "./pages/LeadsPage";
import { RetentionPage } from "./pages/RetentionPage";
import { RequireAuth } from "./app/routing/RequireAuth";
import { PublicOnly } from "./app/routing/PublicOnly";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/onboard",
    element: <OnboardPage />,
  },
  {
    path: "/login",
    element: (
      <PublicOnly>
        <LoginPage />
      </PublicOnly>
    ),
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "members", element: <MembersPage /> },
      { path: "members/:id", element: <MemberWorkspacePage /> },
      { path: "plans", element: <PlansPage /> },
      { path: "subscriptions", element: <SubscriptionsPage /> },
      { path: "attendance", element: <AttendancePage /> },
      { path: "attendance-setup", element: <AttendanceSetupPage /> },
      { path: "leads", element: <LeadsPage /> },
      { path: "retention", element: <RetentionPage /> },
      { path: "payments", element: <PaymentsPage /> },
      { path: "invoices", element: <InvoicesPage /> },
      { path: "announcements", element: <AnnouncementsPage /> },
      { path: "trainers", element: <TrainersPage /> },
      { path: "workout-plans", element: <WorkoutPlansPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "billing", element: <BillingPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
