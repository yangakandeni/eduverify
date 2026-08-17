"use client";

import { WifiOff } from "lucide-react";
import { useEffect } from "react";
import { getServiceUnavailableDetail, getServiceUnavailableHeading } from "@/lib/browse";

/** Root error boundary — catches an uncaught throw from any server-rendered page (the
 * homepage, the qualifications page, the dashboard) once USE_EXTERNAL_API is set, since
 * there's no local fallback left for getInstitution/searchInstitutions/getAllInstitutions
 * to degrade to. Error boundaries must be Client Components; unstable_retry() re-fetches and
 * re-renders the failed segment (see node_modules/next/dist/docs — this pinned Next version
 * uses unstable_retry, not the older reset-only contract). */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-24">
      <div className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center">
        <WifiOff className="h-8 w-8 text-rose-500" />
        <p className="font-display text-lg font-semibold text-rose-700">{getServiceUnavailableHeading()}</p>
        <p className="text-sm text-rose-600">{getServiceUnavailableDetail()}</p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
