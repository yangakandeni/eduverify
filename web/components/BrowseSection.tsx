"use client";

import { AlertCircle, Loader2, WifiOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import BrowseHeader from "@/components/BrowseHeader";
import BrowseInstitutionCard from "@/components/BrowseInstitutionCard";
import BrowsePagination from "@/components/BrowsePagination";
import {
  ALL_PROVINCES_VALUE,
  ALL_STATUSES_VALUE,
  ALL_TYPES_VALUE,
  filterInstitutionsForBrowse,
  getEmptyStateDetail,
  getEmptyStateHeading,
  getInflightMessage,
  getServiceUnavailableDetail,
  getServiceUnavailableHeading,
  isProvinceFilterDisabled,
  isStatusOptionValidForType,
} from "@/lib/browse";
import { useSavedInstitutions } from "@/lib/savedInstitutions";
import type { InstitutionRecord } from "@/lib/types";

const ITEMS_PER_PAGE = 6;
const INFLIGHT_TICK_MS = 100;

/** Escalating status text shown while a search is in flight. Mounted only for the
 * lifetime of the loading state (see the `loading` branch below), so a fresh mount —
 * and a fresh countdown from "Checking the register..." — happens for free each time a
 * new search starts, with no need to manually reset state across loading sessions. */
function InflightStatus() {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMs((value) => value + INFLIGHT_TICK_MS);
    }, INFLIGHT_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return <p aria-live="polite">{getInflightMessage(elapsedMs)}</p>;
}

interface BrowseSectionProps {
  institutions: InstitutionRecord[];
  query?: string;
  loading?: boolean;
  /** A search/fetch to the verification service failed — distinct from "no results," since
   * there's no local fallback left to degrade to post-cutover. Takes precedence over loading
   * and the empty state. */
  error?: boolean;
  initialPage?: number;
  onVerify: (institution: InstitutionRecord) => void;
  onClearSearch?: () => void;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
}

export default function BrowseSection({
  institutions,
  query,
  loading,
  error,
  initialPage,
  onVerify,
  onClearSearch,
  onPageChange,
  onRetry,
}: BrowseSectionProps) {
  const [province, setProvince] = useState(ALL_PROVINCES_VALUE);
  const [institutionType, setInstitutionType] = useState(ALL_TYPES_VALUE);
  const [status, setStatus] = useState(ALL_STATUSES_VALUE);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [page, setPage] = useState(initialPage ?? 1);
  const [savedIds, toggleSaved] = useSavedInstitutions();
  const sectionTopRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => filterInstitutionsForBrowse(institutions, { province, institutionType, status }),
    [institutions, province, institutionType, status]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageInstitutions = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function goToPage(target: number) {
    const next = Math.min(Math.max(target, 1), totalPages);
    setPage(next);
    onPageChange?.(next);
    sectionTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetToFirstPage() {
    setPage(1);
    onPageChange?.(1);
  }

  function handleProvinceChange(value: string) {
    setProvince(value);
    resetToFirstPage();
  }

  function handleInstitutionTypeChange(value: string) {
    setInstitutionType(value);
    if (!isStatusOptionValidForType(status, value)) setStatus(ALL_STATUSES_VALUE);
    resetToFirstPage();
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    if (isProvinceFilterDisabled(value)) setProvince(ALL_PROVINCES_VALUE);
    resetToFirstPage();
  }

  function clearFilters() {
    setProvince(ALL_PROVINCES_VALUE);
    setInstitutionType(ALL_TYPES_VALUE);
    setStatus(ALL_STATUSES_VALUE);
    resetToFirstPage();
  }

  return (
    <section className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-6xl scroll-mt-16" ref={sectionTopRef}>
        <BrowseHeader
          resultCount={filtered.length}
          query={query}
          loading={loading}
          province={province}
          institutionType={institutionType}
          status={status}
          onProvinceChange={handleProvinceChange}
          onInstitutionTypeChange={handleInstitutionTypeChange}
          onStatusChange={handleStatusChange}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((value) => !value)}
        />

        {error ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center">
            <WifiOff className="h-8 w-8 text-rose-500" />
            <p className="font-semibold text-rose-700">{getServiceUnavailableHeading()}</p>
            <p className="max-w-md text-sm text-rose-600">{getServiceUnavailableDetail()}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 text-sm font-medium text-rose-700 underline-offset-2 hover:underline"
              >
                Try again
              </button>
            )}
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <InflightStatus />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-10 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="font-semibold text-foreground">{getEmptyStateHeading()}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {getEmptyStateDetail(query)}
              {query && (
                <>
                  {" "}
                  Verify directly with DHET at{" "}
                  <a
                    href="https://www.dhet.gov.za"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    www.dhet.gov.za
                  </a>{" "}
                  or SAQA at{" "}
                  <a
                    href="https://www.saqa.org.za"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    www.saqa.org.za
                  </a>
                  .
                </>
              )}
            </p>
            {(!query || onClearSearch) && (
              <button
                type="button"
                onClick={query ? onClearSearch : clearFilters}
                className="mt-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                {query ? "Clear search" : "Clear filters"}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageInstitutions.map((institution) => (
                <BrowseInstitutionCard
                  key={institution.id}
                  institution={institution}
                  saved={savedIds.has(institution.id)}
                  onToggleSaved={() => toggleSaved(institution.id)}
                  onVerify={() => onVerify(institution)}
                  query={query}
                  page={currentPage}
                />
              ))}
            </div>

            <BrowsePagination page={currentPage} totalPages={totalPages} onGoToPage={goToPage} />
          </>
        )}
      </div>
    </section>
  );
}
