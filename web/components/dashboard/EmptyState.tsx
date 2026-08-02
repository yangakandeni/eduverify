import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  actionLabel: string;
  actionHref: string;
}

export default function EmptyState({ icon: Icon, message, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </span>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
      <Link href={actionHref} className="text-sm font-semibold text-primary hover:text-accent">
        {actionLabel}
      </Link>
    </div>
  );
}
