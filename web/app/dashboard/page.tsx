import { auth, currentUser } from "@clerk/nextjs/server";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/dashboard/EmptyState";
import { getSavedInstitutions } from "@/lib/dashboardData";

export default async function DashboardOverviewPage() {
  const { userId } = await auth();
  const user = await currentUser();
  const saved = await getSavedInstitutions(userId!);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your saved institutions and account at a glance.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <Bookmark className="h-4 w-4 text-accent" />
            Saved Institutions
          </h2>
          <Link href="/dashboard/saved" className="text-sm font-medium text-primary hover:text-accent">
            View all
          </Link>
        </div>
        {saved.length === 0 && (
          <EmptyState
            icon={Bookmark}
            message="You haven't saved any institutions yet. Bookmark one while browsing to see it here."
            actionLabel="Browse institutions"
            actionHref="/#browse"
          />
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">Account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in as {user?.primaryEmailAddress?.emailAddress ?? "—"}
            </p>
          </div>
          <Link href="/dashboard/settings" className="text-sm font-medium text-primary hover:text-accent">
            Manage settings
          </Link>
        </div>
      </section>
    </div>
  );
}
