import { GraduationCap } from "lucide-react";
import { getDisplayName } from "@/lib/presentation";
import type { QualificationSearchHit } from "@/lib/qualificationsData";

interface QualificationSearchResultsProps {
  hits: QualificationSearchHit[];
}

export default function QualificationSearchResults({ hits }: QualificationSearchResultsProps) {
  if (hits.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-6">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Matching Programmes
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hits.map(({ qualification, institution }) => {
          const href = `/institutions/${institution.id}/qualifications?${new URLSearchParams({
            faculty: qualification.subfield,
          }).toString()}`;

          return (
            <a
              key={qualification.qualId}
              href={href}
              className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:bg-secondary"
            >
              <p className="line-clamp-2 font-display text-sm font-semibold text-foreground">{qualification.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {getDisplayName(institution.name, institution.tradingName)}
              </p>
              {qualification.nqfLevel && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  <GraduationCap className="h-3 w-3" />
                  NQF Level {qualification.nqfLevel}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
