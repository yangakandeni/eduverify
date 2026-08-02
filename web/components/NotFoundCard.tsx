import { AlertTriangle, FileSearch, Flag, Phone } from "lucide-react";

export default function NotFoundCard({ query }: { query: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50 shadow-sm">
      <div className="flex items-start gap-3 p-5">
        <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600" />
        <div>
          <h3 className="font-semibold text-amber-900">
            &quot;{query}&quot; was not found in the DHET register
          </h3>
          <p className="mt-1 text-sm text-amber-800">
            This doesn&apos;t automatically mean the provider is fraudulent — registrations can
            be listed under a different legal name, or the register excerpt we hold may be out
            of date. Treat this as a reason to verify further, not a final answer.
          </p>
        </div>
      </div>

      <div className="grid gap-3 border-t border-amber-200 bg-white/60 p-5 sm:grid-cols-3">
        <div className="flex gap-2 text-sm text-amber-900">
          <FileSearch className="h-4 w-4 flex-shrink-0" />
          <span>Try searching by the institution&apos;s official registration number instead of its trading name.</span>
        </div>
        <div className="flex gap-2 text-sm text-amber-900">
          <Phone className="h-4 w-4 flex-shrink-0" />
          <span>Confirm directly with the Department of Higher Education and Training (DHET) before enrolling or paying fees.</span>
        </div>
        <div className="flex gap-2 text-sm text-amber-900">
          <Flag className="h-4 w-4 flex-shrink-0" />
          <span>If you suspect a provider is misrepresenting its accreditation, report it to DHET so they can investigate.</span>
        </div>
      </div>
    </div>
  );
}
