import { BookOpen } from "lucide-react";
import type { SaqaQualification } from "@/lib/types";

interface QualificationsGridProps {
  qualifications: SaqaQualification[];
  searchTerm?: string;
  facultyName?: string;
}

const PILL_CLASS = "inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground";

export default function QualificationsGrid({ qualifications, searchTerm, facultyName }: QualificationsGridProps) {
  if (qualifications.length === 0) {
    const title = searchTerm
      ? `No qualifications found for "${searchTerm}"${facultyName ? ` in ${facultyName} faculty` : ""}`
      : "No qualifications found";
    const subtext = searchTerm
      ? `Try a different search term, or clear the search to browse all qualifications ${facultyName ? "in this faculty" : "here"}.`
      : "This institution has no SAQA-registered qualifications on file for this selection.";

    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground/50" />
        <p className="font-display text-base font-semibold text-foreground">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{subtext}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {qualifications.map((qualification) => (
        <QualificationCard key={qualification.qualId} qualification={qualification} />
      ))}
    </div>
  );
}

function QualificationCard({ qualification }: { qualification: SaqaQualification }) {
  const nqfLabel = qualification.nqfLevel ? `NQF Level ${qualification.nqfLevel}` : qualification.nqfLevelRaw;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className={PILL_CLASS}>SAQA ID {qualification.qualId}</span>
        <span className={PILL_CLASS}>{nqfLabel}</span>
      </div>

      <h3 className="line-clamp-3 font-display text-sm font-semibold leading-snug text-foreground">
        {qualification.title}
      </h3>

      {qualification.credits !== undefined && (
        <div className="mt-auto border-t border-border pt-3">
          <div className="group relative inline-flex">
            <span
              tabIndex={0}
              aria-describedby={`credits-tooltip-${qualification.qualId}`}
              className="inline-flex cursor-help items-center rounded-full border border-border bg-transparent px-2.5 py-1 text-xs font-medium text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Min. Credits: {qualification.credits}
            </span>
            <span
              id={`credits-tooltip-${qualification.qualId}`}
              role="tooltip"
              className="pointer-events-none absolute top-full left-0 z-10 mt-2 w-max max-w-64 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
            >
              You need a minimum of {qualification.credits} credits to apply
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
