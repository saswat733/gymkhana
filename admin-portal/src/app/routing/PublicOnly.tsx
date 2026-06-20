import * as React from "react";
import { Navigate } from "react-router-dom";

import { useAuthStore } from "../../lib/authStore";

export function PublicOnly({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (token) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

