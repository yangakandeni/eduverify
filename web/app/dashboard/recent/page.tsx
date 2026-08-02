import { auth } from "@clerk/nextjs/server";
import { Clock } from "lucide-react";
import type { Metadata } from "next";
import EmptyState from "@/components/dashboard/EmptyState";
import { getRecentlyViewedInstitutions } from "@/lib/dashboardData";

export const metadata: Metadata = {
  title: "Recently Viewed — EduVerify",
};

export default async function RecentlyViewedPage() {
  const { userId } = await auth();
  const recent = await getRecentlyViewedInstitutions(userId!);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Recently Viewed</h1>
        <p className="mt-1 text-sm text-muted-foreground">Institutions you&apos;ve looked up recently.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        {recent.length === 0 && (
          <EmptyState
            icon={Clock}
            message="Institutions you look up will show up here for quick access."
            actionLabel="Browse institutions"
            actionHref="/#browse"
          />
        )}
      </section>
    </div>
  );
}
