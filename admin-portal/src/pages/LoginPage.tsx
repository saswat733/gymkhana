import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Dumbbell, Loader2 } from "lucide-react";
import * as React from "react";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { login } from "../features/auth/auth.api";
import { extractFieldErrors } from "../lib/api";
import { useAuthStore } from "../lib/authStore";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@gymkhana.local", password: "Admin@12345" },
  });

  const [formError, setFormError] = React.useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const res = await login(values);
      setAuth(res);
      toast.success("Logged in");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      for (const [field, message] of Object.entries(fieldErrors)) {
        setError(field as keyof FormValues, { type: "server", message });
      }
      setFormError((err as any)?.message ?? "Login failed");
      toast.error("Login failed");
    }
  });

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>GymKhana</CardTitle>
                <CardDescription>Sign in to the admin portal</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input placeholder="admin@gym.com" autoComplete="email" {...register("email")} />
                {errors.email?.message ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" autoComplete="current-password" {...register("password")} />
                {errors.password?.message ? (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                ) : null}
              </div>

              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign in
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                New gym? <Link to="/onboard" className="underline">Create your gym</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

