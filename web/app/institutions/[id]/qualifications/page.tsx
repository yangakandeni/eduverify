import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FacultySidebar from "@/components/qualifications/FacultySidebar";
import QualificationsGrid from "@/components/qualifications/QualificationsGrid";
import { getInstitution } from "@/lib/institutions";
import { getDisplayName, getStatusBadge } from "@/lib/presentation";
import { getFacultiesForInstitution, getQualificationsForInstitutionFaculty } from "@/lib/qualificationsData";

interface QualificationsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ faculty?: string }>;
}

export async function generateMetadata({ params }: QualificationsPageProps): Promise<Metadata> {
  const { id } = await params;
  const institution = await getInstitution(decodeURIComponent(id));
  return { title: institution ? `${getDisplayName(institution.name, institution.tradingName)} — Qualifications` : "Qualifications" };
}

export default async function QualificationsPage({ params, searchParams }: QualificationsPageProps) {
  const { id } = await params;
  const { faculty } = await searchParams;

  const institution = await getInstitution(decodeURIComponent(id));
  if (!institution) notFound();

  const badge = getStatusBadge(institution);
  const faculties = getFacultiesForInstitution(institution.id);
  const qualifications = getQualificationsForInstitutionFaculty(institution.id, faculty);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {getDisplayName(institution.name, institution.tradingName)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Qualifications &amp; Faculties</p>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            badge.cancelled ? "bg-rose-50 text-rose-700" : badge.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {badge.cancelled ? (
            <XCircle className="h-3.5 w-3.5" />
          ) : badge.verified ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
          {badge.label}
        </div>
      </div>

      {faculties.length === 0 ? (
        <QualificationsGrid qualifications={[]} />
      ) : (
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <aside className="md:w-64 md:flex-shrink-0">
            <FacultySidebar institutionId={institution.id} faculties={faculties} activeFaculty={faculty} />
          </aside>
          <div className="min-w-0 flex-1">
            <QualificationsGrid qualifications={qualifications} />
          </div>
        </div>
      )}
    </main>
  );
}
