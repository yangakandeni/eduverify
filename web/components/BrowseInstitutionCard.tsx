"use client";

import { BadgeCheck, Bookmark, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { institutionCategoryLabels } from "@/lib/categories";
import { TYPE_LABEL, getBrandColor, getDisplayName, getInitials, getStatusBadge, hasNoFurtherDetails } from "@/lib/presentation";
import type { InstitutionRecord } from "@/lib/types";

const MAX_VISIBLE_CATEGORY_TAGS = 3;

function websiteHref(website: string): string {
  return website.startsWith("http") ? website : `https://${website}`;
}

interface BrowseInstitutionCardProps {
  institution: InstitutionRecord;
  saved: boolean;
  onToggleSaved: () => void;
  onVerify: () => void;
}

export default function BrowseInstitutionCard({
  institution,
  saved,
  onToggleSaved,
  onVerify,
}: BrowseInstitutionCardProps) {
  const badge = getStatusBadge(institution);
  const brandColor = getBrandColor(institution);
  const noFurtherDetails = hasNoFurtherDetails(institution);
  const categoryLabels = institutionCategoryLabels(institution);
  const visibleCategoryLabels = categoryLabels.slice(0, MAX_VISIBLE_CATEGORY_TAGS);
  const remainingCategoryCount = categoryLabels.length - visibleCategoryLabels.length;

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

      {!noFurtherDetails && (
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            {institution.province}
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

      {categoryLabels.length > 0 && (
        <div className="mt-3 mb-4 flex flex-wrap gap-1.5">
          {visibleCategoryLabels.map((label) => (
            <span key={label} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {label}
            </span>
          ))}
          {remainingCategoryCount > 0 && (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              +{remainingCategoryCount}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onVerify}
          disabled={noFurtherDetails}
          title={noFurtherDetails ? "No further information is available for this institution" : undefined}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            noFurtherDetails
              ? "cursor-not-allowed bg-secondary text-muted-foreground opacity-60"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          More Info
        </button>
        {noFurtherDetails ? (
          <button
            type="button"
            disabled
            title="No website is available for this institution"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground opacity-60"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Website
          </button>
        ) : (
          institution.contacts.website && (
            <a
              href={websiteHref(institution.contacts.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-secondary"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Website
            </a>
          )
        )}
      </div>
    </div>
  );
}
