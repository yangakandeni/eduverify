"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
  isProvinceFilterDisabled,
  isStatusOptionValidForType,
} from "@/lib/browse";
import { useSavedInstitutions } from "@/lib/savedInstitutions";
import type { InstitutionRecord } from "@/lib/types";

const ITEMS_PER_PAGE = 6;

interface BrowseSectionProps {
  institutions: InstitutionRecord[];
  query?: string;
  loading?: boolean;
  onVerify: (institution: InstitutionRecord) => void;
  onClearSearch?: () => void;
}

export default function BrowseSection({ institutions, query, loading, onVerify, onClearSearch }: BrowseSectionProps) {
  const [province, setProvince] = useState(ALL_PROVINCES_VALUE);
  const [institutionType, setInstitutionType] = useState(ALL_TYPES_VALUE);
  const [status, setStatus] = useState(ALL_STATUSES_VALUE);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [page, setPage] = useState(1);
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
    setPage(Math.min(Math.max(target, 1), totalPages));
    sectionTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleProvinceChange(value: string) {
    setProvince(value);
    setPage(1);
  }

  function handleInstitutionTypeChange(value: string) {
    setInstitutionType(value);
    if (!isStatusOptionValidForType(status, value)) setStatus(ALL_STATUSES_VALUE);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    if (isProvinceFilterDisabled(value)) setProvince(ALL_PROVINCES_VALUE);
    setPage(1);
  }

  function clearFilters() {
    setProvince(ALL_PROVINCES_VALUE);
    setInstitutionType(ALL_TYPES_VALUE);
    setStatus(ALL_STATUSES_VALUE);
    setPage(1);
  }

  return (
    <section className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-6xl scroll-mt-16" ref={sectionTopRef}>
        <BrowseHeader
          resultCount={filtered.length}
          query={query}
          province={province}
          institutionType={institutionType}
          status={status}
          onProvinceChange={handleProvinceChange}
          onInstitutionTypeChange={handleInstitutionTypeChange}
          onStatusChange={handleStatusChange}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((value) => !value)}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Checking the register...</p>
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
