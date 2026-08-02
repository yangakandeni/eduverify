"use client";

import { BadgeCheck, ChevronLeft, ChevronRight, GitCompare, GraduationCap, Heart, MapPin, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { TYPE_LABEL, getAvatarPalette, getDisplayName, getInitials, getStatusBadge } from "@/lib/presentation";
import type { InstitutionRecord } from "@/lib/types";

const SAVED_KEY = "eduverify:saved";
const MAX_COMPARE = 4;
const ITEMS_PER_PAGE = 6;

interface InstitutionGridProps {
  institutions: InstitutionRecord[];
  onExplore: (institution: InstitutionRecord) => void;
  emptyMessage?: string;
}

/** One-time snapshot read, not a subscription — a lazy initializer avoids the
 * SSR-only render entirely re-running via an effect (and reads correctly again once
 * this client component mounts and hydrates in the browser). */
function readSavedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function sortWithFeaturedFirst(institutions: InstitutionRecord[]): InstitutionRecord[] {
  const alphabetical = [...institutions].sort((a, b) => a.name.localeCompare(b.name));
  const promoted = alphabetical.filter((institution) => institution.isFeatured || institution.isSponsored);
  const rest = alphabetical.filter((institution) => !institution.isFeatured && !institution.isSponsored);
  return [...promoted, ...rest];
}

/** Windowed page list with ellipsis gaps, e.g. [1, "ellipsis", 4, 5, 6, "ellipsis", 12]. */
function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set<number>([1, total, current]);
  if (current - 1 >= 1) pages.add(current - 1);
  if (current + 1 <= total) pages.add(current + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("ellipsis");
    result.push(page);
  });
  return result;
}

export default function InstitutionGrid({ institutions, onExplore, emptyMessage }: InstitutionGridProps) {
  const [savedIds, setSavedIds] = useState<Set<string>>(readSavedIds);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const gridTopRef = useRef<HTMLDivElement>(null);

  const sortedInstitutions = useMemo(() => sortWithFeaturedFirst(institutions), [institutions]);

  const institutionsKey = institutions.map((institution) => institution.id).join("|");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageResetKey, setPageResetKey] = useState(institutionsKey);
  if (institutionsKey !== pageResetKey) {
    setPageResetKey(institutionsKey);
    setCurrentPage(1);
  }

  const totalItems = sortedInstitutions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  if (page !== currentPage) setCurrentPage(page);

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const pageInstitutions = sortedInstitutions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function goToPage(target: number) {
    const next = Math.min(Math.max(target, 1), totalPages);
    setCurrentPage(next);
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify([...savedIds]));
  }, [savedIds]);

  function toggleSaved(id: string) {
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCompare(id: string) {
    setCompareIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_COMPARE) {
        next.add(id);
      }
      return next;
    });
  }

  const compareList = institutions.filter((institution) => compareIds.has(institution.id));

  if (institutions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
        {emptyMessage ?? "No institutions match these filters yet."}
      </div>
    );
  }

  return (
    <div>
      <div ref={gridTopRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pageInstitutions.map((institution) => (
          <InstitutionGridCard
            key={institution.id}
            institution={institution}
            saved={savedIds.has(institution.id)}
            comparing={compareIds.has(institution.id)}
            compareDisabled={!compareIds.has(institution.id) && compareIds.size >= MAX_COMPARE}
            onToggleSaved={() => toggleSaved(institution.id)}
            onToggleCompare={() => toggleCompare(institution.id)}
            onExplore={() => onExplore(institution)}
          />
        ))}
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        pageSize={ITEMS_PER_PAGE}
        onGoToPage={goToPage}
      />

      {compareIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg">
            <span className="text-sm font-medium text-foreground">
              {compareIds.size} selected for comparison
            </span>
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              disabled={compareIds.size < 2}
              className="rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Compare
            </button>
            <button
              type="button"
              onClick={() => setCompareIds(new Set())}
              aria-label="Clear comparison"
              className="rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Modal open={compareOpen} onClose={() => setCompareOpen(false)} title="Compare institutions" widthClassName="max-w-3xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4">Institution</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Province</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Qualifications</th>
              </tr>
            </thead>
            <tbody>
              {compareList.map((institution) => {
                const badge = getStatusBadge(institution);
                return (
                  <tr key={institution.id} className="border-b border-border/60">
                    <td className="py-3 pr-4 font-medium text-foreground">{institution.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{TYPE_LABEL[institution.institutionType] ?? institution.institutionType}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{institution.province}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{badge.label}</td>
                    <td className="py-3 text-muted-foreground">{institution.qualifications.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  pageSize: number;
  onGoToPage: (page: number) => void;
}

function PaginationControls({ page, totalPages, totalItems, startIndex, pageSize, onGoToPage }: PaginationControlsProps) {
  const rangeStart = startIndex + 1;
  const rangeEnd = Math.min(startIndex + pageSize, totalItems);

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <span className="rounded-full bg-secondary px-3 py-1 font-mono text-xs font-medium text-muted-foreground">
        Showing {rangeStart}–{rangeEnd} of {totalItems} institution{totalItems === 1 ? "" : "s"}
      </span>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onGoToPage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {buildPageList(page, totalPages).map((entry, index) =>
            entry === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onGoToPage(entry)}
                aria-current={entry === page ? "page" : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition ${
                  entry === page
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground hover:bg-secondary"
                }`}
              >
                {entry}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => onGoToPage(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}

interface InstitutionGridCardProps {
  institution: InstitutionRecord;
  saved: boolean;
  comparing: boolean;
  compareDisabled: boolean;
  onToggleSaved: () => void;
  onToggleCompare: () => void;
  onExplore: () => void;
}

function InstitutionGridCard({
  institution,
  saved,
  comparing,
  compareDisabled,
  onToggleSaved,
  onToggleCompare,
  onExplore,
}: InstitutionGridCardProps) {
  const badge = getStatusBadge(institution);
  const palette = getAvatarPalette(institution.id);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${palette}`}>
          {getInitials(institution.name)}
        </div>
        <button
          type="button"
          onClick={onToggleSaved}
          aria-label={saved ? "Remove from saved" : "Save institution"}
          aria-pressed={saved}
          className={`rounded-full p-1.5 transition ${saved ? "text-rose-500" : "text-muted-foreground/50 hover:text-rose-400"}`}
        >
          <Heart className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs font-semibold ${
            badge.verified
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          <BadgeCheck className="h-3 w-3" />
          {badge.label}
        </span>
      </div>

      <h3 className="mt-2 line-clamp-2 font-display text-base font-semibold text-foreground">
        {getDisplayName(institution.name, institution.tradingName)}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {institution.province}
        </span>
        <span className="text-border">·</span>
        <span>{TYPE_LABEL[institution.institutionType] ?? institution.institutionType}</span>
      </div>

      <div className="mt-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          <GraduationCap className="h-3.5 w-3.5" />
          {institution.qualifications.length} qualifications
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onExplore}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Explore
        </button>
        <button
          type="button"
          onClick={onToggleCompare}
          disabled={compareDisabled}
          aria-pressed={comparing}
          title={compareDisabled ? "You can compare up to 4 institutions at a time" : "Toggle compare"}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
            comparing
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-primary/30 hover:bg-secondary"
          }`}
        >
          <GitCompare className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
