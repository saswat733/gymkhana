import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { onboardGym } from "../features/gym/gym.api";
import { useAuthStore } from "../lib/authStore";

export function OnboardPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [busy, setBusy] = useState(false);
  const [gymName, setGymName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");

  async function onSubmit() {
    setBusy(true);
    try {
      const res = await onboardGym({ gymName, ownerName, ownerEmail, ownerPassword, planCode: "basic" });
      setAuth({
        user: res.owner as { id: string; name: string; email: string; role: string },
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      toast.success("Gym created — welcome!");
      navigate("/dashboard", { replace: true });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Onboarding failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Start your gym on GymKhana</CardTitle>
            <CardDescription>Create a new gym tenant with a 14-day trial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Gym name" value={gymName} onChange={(e) => setGymName(e.target.value)} />
            <Input placeholder="Your name (owner)" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            <Input placeholder="Owner email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
            <Input
              placeholder="Password"
              type="password"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
            />
            <Button className="w-full" onClick={onSubmit} disabled={busy || !gymName || !ownerName || !ownerEmail || !ownerPassword}>
              {busy ? "Creating…" : "Create gym & start trial"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
