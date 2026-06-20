import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { changePassword, me } from "../features/auth/auth.api";
import { getMyGym, updateMyGym } from "../features/gym/gym.api";
import { extractFieldErrors } from "../lib/api";
import { useAuthStore } from "../lib/authStore";

const passwordRules = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Z]/, "Need an uppercase letter")
  .regex(/[a-z]/, "Need a lowercase letter")
  .regex(/[0-9]/, "Need a digit");

const changeSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangeForm = z.infer<typeof changeSchema>;

export function SettingsPage() {
  const clear = useAuthStore((s) => s.clear);
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: me,
    staleTime: 30_000,
  });

  const gymQuery = useQuery({
    queryKey: ["gym", "me"],
    queryFn: getMyGym,
    staleTime: 30_000,
  });

  const user = meQuery.data;
  const gym = gymQuery.data;

  const [gymName, setGymName] = React.useState("");
  const [legalName, setLegalName] = React.useState("");
  const [gstin, setGstin] = React.useState("");
  const [billingLine1, setBillingLine1] = React.useState("");
  const [billingCity, setBillingCity] = React.useState("");
  const [billingState, setBillingState] = React.useState("");
  const [billingPincode, setBillingPincode] = React.useState("");
  const [defaultGstPercent, setDefaultGstPercent] = React.useState("18");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [brandPrimary, setBrandPrimary] = React.useState("#7c3aed");
  const [brandSecondary, setBrandSecondary] = React.useState("#1a1a24");
  const [customDomain, setCustomDomain] = React.useState("");

  React.useEffect(() => {
    if (!gym) return;
    setGymName(gym.name ?? "");
    setLegalName(gym.legalName ?? "");
    setGstin(gym.gstin ?? "");
    setBillingLine1(gym.billingAddressLine1 ?? "");
    setBillingCity(gym.billingCity ?? "");
    setBillingState(gym.billingState ?? "");
    setBillingPincode(gym.billingPincode ?? "");
    setDefaultGstPercent(String(gym.defaultGstPercent ?? 18));
    setLogoUrl(gym.logoUrl ?? "");
    setBrandPrimary(gym.brandPrimaryColor ?? "#7c3aed");
    setBrandSecondary(gym.brandSecondaryColor ?? "#1a1a24");
    setCustomDomain(gym.customDomain ?? "");
  }, [gym]);

  const gymMut = useMutation({
    mutationFn: () =>
      updateMyGym({
        name: gymName,
        legalName: legalName || null,
        gstin: gstin || null,
        billingAddressLine1: billingLine1 || null,
        billingCity: billingCity || null,
        billingState: billingState || null,
        billingPincode: billingPincode || null,
        defaultGstPercent: Number(defaultGstPercent) || 18,
        logoUrl: logoUrl || null,
        brandPrimaryColor: brandPrimary || null,
        brandSecondaryColor: brandSecondary || null,
        customDomain: customDomain || null,
      }),
    onSuccess: async () => {
      toast.success("Gym profile saved");
      await qc.invalidateQueries({ queryKey: ["gym", "me"] });
    },
    onError: () => toast.error("Could not save gym profile"),
  });

  const form = useForm<ChangeForm>({
    resolver: zodResolver(changeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const changeMut = useMutation({
    mutationFn: changePassword,
    onSuccess: async (data) => {
      setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      await qc.invalidateQueries({ queryKey: ["auth", "me"] });
      form.reset();
      toast.success("Password updated");
    },
    onError: (err) => {
      const fields = extractFieldErrors(err);
      for (const [k, msg] of Object.entries(fields)) {
        const key = k as keyof ChangeForm;
        if (key === "currentPassword" || key === "newPassword" || key === "confirmPassword") {
          form.setError(key, { type: "server", message: msg });
        }
      }
      toast.error("Could not update password");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Account and profile settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your signed-in admin account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {meQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : meQuery.isError || !user ? (
            <div className="text-sm text-destructive">Failed to load profile.</div>
          ) : (
            <div className="grid gap-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="font-medium">{user.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-medium">{user.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Role</div>
                <div className="font-medium">{user.role}</div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button variant="outline" onClick={() => clear()}>
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gym profile & GST</CardTitle>
          <CardDescription>Billing details for invoices (India GST).</CardDescription>
        </CardHeader>
        <CardContent className="max-w-md space-y-3">
          {gymQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <Input placeholder="Gym display name" value={gymName} onChange={(e) => setGymName(e.target.value)} />
              <Input placeholder="Legal business name" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
              <Input placeholder="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} />
              <Input placeholder="Billing address" value={billingLine1} onChange={(e) => setBillingLine1(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="City" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} />
                <Input placeholder="State" value={billingState} onChange={(e) => setBillingState(e.target.value)} />
              </div>
              <Input placeholder="Pincode" value={billingPincode} onChange={(e) => setBillingPincode(e.target.value)} />
              <Input
                type="number"
                min={0}
                max={28}
                step={0.01}
                placeholder="Default GST %"
                value={defaultGstPercent}
                onChange={(e) => setDefaultGstPercent(e.target.value)}
              />
              <Button onClick={() => gymMut.mutate()} disabled={gymMut.isPending}>
                {gymMut.isPending ? "Saving…" : "Save gym profile"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>White label branding</CardTitle>
          <CardDescription>Logo, colors, and custom domain (future: gymname.gymkhana.app).</CardDescription>
        </CardHeader>
        <CardContent className="max-w-md space-y-3">
          <Input placeholder="Logo URL" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Primary color" value={brandPrimary} onChange={(e) => setBrandPrimary(e.target.value)} />
            <Input placeholder="Secondary color" value={brandSecondary} onChange={(e) => setBrandSecondary(e.target.value)} />
          </div>
          <Input placeholder="Custom domain" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} />
          <Button onClick={() => gymMut.mutate()} disabled={gymMut.isPending}>
            Save branding
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password. You will stay signed in with refreshed tokens.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="max-w-md space-y-4"
            onSubmit={form.handleSubmit((values) =>
              changeMut.mutate({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
            )}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Current password</label>
              <Input type="password" autoComplete="current-password" {...form.register("currentPassword")} />
              {form.formState.errors.currentPassword?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.currentPassword.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New password</label>
              <Input type="password" autoComplete="new-password" {...form.register("newPassword")} />
              {form.formState.errors.newPassword?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm new password</label>
              <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              ) : null}
            </div>
            <Button type="submit" disabled={changeMut.isPending}>
              {changeMut.isPending ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
