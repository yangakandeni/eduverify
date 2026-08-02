import { SearchX } from "lucide-react";

export default function NotFoundCard({ query }: { query: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
      <div className="flex items-start gap-3">
        <SearchX className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
        <div>
          <h3 className="font-semibold text-amber-900">Institution not found</h3>
          <p className="mt-1 text-sm text-amber-800">
            We couldn&apos;t find &quot;{query}&quot; in our current register.
          </p>
          <p className="mt-2 text-sm text-amber-700">
            This doesn&apos;t necessarily mean the institution is unregistered. Our dataset may be
            incomplete or out of date. Please verify directly with the relevant authority before
            making enrolment or payment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
