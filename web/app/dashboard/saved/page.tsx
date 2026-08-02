import { auth } from "@clerk/nextjs/server";
import { Bookmark } from "lucide-react";
import type { Metadata } from "next";
import EmptyState from "@/components/dashboard/EmptyState";
import { getSavedInstitutions } from "@/lib/dashboardData";

export const metadata: Metadata = {
  title: "Saved Institutions — EduVerify",
};

export default async function SavedInstitutionsPage() {
  const { userId } = await auth();
  const saved = await getSavedInstitutions(userId!);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Saved Institutions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Institutions you&apos;ve bookmarked for later.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        {saved.length === 0 && (
          <EmptyState
            icon={Bookmark}
            message="You haven't saved any institutions yet. Bookmark one while browsing to see it here."
            actionLabel="Browse institutions"
            actionHref="/#browse"
          />
        )}
      </section>
    </div>
  );
}
