import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

export const statusVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        trial: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
        pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
        expired: "bg-red-500/15 text-red-700 dark:text-red-400",
        cancelled: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
        inactive: "bg-zinc-500/10 text-zinc-500",
        frozen: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
        paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        issued: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
        converted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        lost: "bg-red-500/15 text-red-700 dark:text-red-400",
      },
    },
    defaultVariants: { variant: "inactive" },
  },
);

export type StatusVariant = NonNullable<VariantProps<typeof statusVariants>["variant"]>;

const STATUS_MAP: Record<string, StatusVariant> = {
  active: "active",
  trialing: "trial",
  trial: "trial",
  trial_scheduled: "trial",
  trial_completed: "pending",
  created: "pending",
  pending: "pending",
  expired: "expired",
  cancelled: "cancelled",
  inactive: "inactive",
  frozen: "frozen",
  paid: "paid",
  issued: "issued",
  converted: "converted",
  lost: "lost",
  past_due: "expired",
};

export function mapStatus(status: string): StatusVariant {
  return STATUS_MAP[status.toLowerCase()] ?? "inactive";
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const variant = mapStatus(status);
  return (
    <span className={cn(statusVariants({ variant }), className)}>
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}
