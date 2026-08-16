import { BookOpen, GraduationCap, Layers } from "lucide-react";
import type { SaqaQualification } from "@/lib/types";

interface QualificationsGridProps {
  qualifications: SaqaQualification[];
}

export default function QualificationsGrid({ qualifications }: QualificationsGridProps) {
  if (qualifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground/50" />
        <p className="font-display text-base font-semibold text-foreground">No qualifications found</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This institution has no SAQA-registered qualifications on file for this selection.
        </p>
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
        <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {qualification.qualId}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          <GraduationCap className="h-3 w-3" />
          {nqfLabel}
        </span>
      </div>

      <h3 className="line-clamp-3 font-display text-sm font-semibold leading-snug text-foreground">
        {qualification.title}
      </h3>

      {qualification.credits !== undefined && (
        <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          {qualification.credits} Credits
        </div>
      )}
    </div>
  );
}
