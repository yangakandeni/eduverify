"use client";

import { BadgeCheck, Bookmark, GraduationCap, MapPin, ShieldCheck } from "lucide-react";
import {
  TYPE_LABEL,
  getBrandColor,
  getDisplayName,
  getInitials,
  getPrimaryLocation,
  getStatusBadge,
  hasNoAddress,
  hasNoQualifications,
} from "@/lib/presentation";
import type { InstitutionRecord } from "@/lib/types";

interface BrowseInstitutionCardProps {
  institution: InstitutionRecord;
  saved: boolean;
  onToggleSaved: () => void;
  onVerify: () => void;
  query?: string;
  page?: number;
}

export default function BrowseInstitutionCard({
  institution,
  saved,
  onToggleSaved,
  onVerify,
  query,
  page,
}: BrowseInstitutionCardProps) {
  const badge = getStatusBadge(institution);
  const brandColor = getBrandColor(institution);
  const noQualifications = hasNoQualifications(institution);
  const noAddress = hasNoAddress(institution);
  const location = getPrimaryLocation(institution);
  const trimmedQuery = query?.trim();
  const qualificationsParams = new URLSearchParams();
  if (trimmedQuery) {
    qualificationsParams.set("q", trimmedQuery);
    if (page && page > 1) qualificationsParams.set("page", String(page));
  }
  const qualificationsHref = qualificationsParams.size
    ? `/institutions/${encodeURIComponent(institution.id)}/qualifications?${qualificationsParams}`
    : `/institutions/${encodeURIComponent(institution.id)}/qualifications`;
  const qualificationsLabel = trimmedQuery ? "View Qualification" : "Qualifications";

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold text-white"
          style={{ backgroundColor: brandColor }}
        >
          {getInitials(institution.name)}
        </div>
        <button
          type="button"
          onClick={onToggleSaved}
          aria-label={saved ? "Remove from saved" : "Save institution"}
          aria-pressed={saved}
          className={`rounded-full p-1.5 transition ${saved ? "text-foreground" : "text-muted-foreground/50 hover:text-foreground"}`}
        >
          <Bookmark className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>

      <h3 className="mt-3 line-clamp-2 font-display text-base font-semibold text-foreground">
        {getDisplayName(institution.name, institution.tradingName)}
      </h3>
      <p className="text-sm text-muted-foreground">{TYPE_LABEL[institution.institutionType] ?? institution.institutionType}</p>

      {location && (
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            {location}
          </div>
        </div>
      )}

      <div
        className={`mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
          badge.cancelled ? "bg-rose-50 text-rose-700" : badge.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        <BadgeCheck className="h-3.5 w-3.5" />
        {badge.label}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onVerify}
          disabled={noAddress}
          title={noAddress ? "No further information is available for this institution" : undefined}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            noAddress
              ? "cursor-not-allowed bg-secondary text-muted-foreground opacity-60"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Contact Info
        </button>
        {noQualifications ? (
          <button
            type="button"
            disabled
            title="No qualifications listed"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground opacity-60"
          >
            <GraduationCap className="h-4 w-4" />
            Qualifications
          </button>
        ) : (
          <a
            href={qualificationsHref}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-secondary"
          >
            <GraduationCap className="h-4 w-4" />
            {qualificationsLabel}
          </a>
        )}
      </div>
    </div>
  );
}
