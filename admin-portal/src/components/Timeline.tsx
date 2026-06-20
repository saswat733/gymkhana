import { cn } from "../lib/utils";

export type TimelineItem = {
  id: string;
  time: string;
  title: string;
  description?: string;
  tone?: "default" | "success" | "warning" | "info";
};

const toneDot: Record<NonNullable<TimelineItem["tone"]>, string> = {
  default: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, i) => (
        <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
          {i < items.length - 1 ? (
            <span className="absolute left-[7px] top-4 h-[calc(100%-4px)] w-px bg-border" />
          ) : null}
          <span className={cn("relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full", toneDot[item.tone ?? "default"])} />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground">{item.time}</div>
            <div className="text-sm font-medium">{item.title}</div>
            {item.description ? <div className="text-sm text-muted-foreground">{item.description}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
