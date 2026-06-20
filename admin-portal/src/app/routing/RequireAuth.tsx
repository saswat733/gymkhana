import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "../../lib/authStore";
import { me } from "../../features/auth/auth.api";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: me,
    enabled: Boolean(token) && !user,
    retry: false,
    staleTime: 30_000,
  });

  React.useEffect(() => {
    if (!meQuery.data) return;
    if (!token || !refreshToken) return;
    setAuth({ user: meQuery.data, accessToken: token, refreshToken });
  }, [meQuery.data, refreshToken, setAuth, token]);

  // If we had a token but can't load user, force logout.
  if (meQuery.isError) {
    useAuthStore.getState().clear();
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (meQuery.isLoading) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="text-sm text-muted-foreground">Loading session…</div>
      </div>
    );
  }

  return <>{children}</>;
}

