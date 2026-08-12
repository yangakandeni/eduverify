import { auth, currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export const metadata: Metadata = {
  title: "Dashboard — EduVerify",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await auth.protect();
  const user = await currentUser();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10 md:flex-row md:gap-8">
      <aside className="md:w-56 md:flex-shrink-0">
        <div className="mb-4 hidden md:block">
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <p className="font-display text-lg font-semibold text-foreground">{user?.firstName ?? "there"}</p>
        </div>
        <DashboardSidebar />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </main>
  );
}
