"use client";

import { X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import BrowseHeader from "@/components/BrowseHeader";
import BrowseInstitutionCard from "@/components/BrowseInstitutionCard";
import BrowsePagination from "@/components/BrowsePagination";
import Modal from "@/components/ui/Modal";
import { ALL_PROVINCES_VALUE, ALL_TYPES_VALUE, filterInstitutionsForBrowse } from "@/lib/browse";
import { TYPE_LABEL, getStatusBadge } from "@/lib/presentation";
import { useSavedInstitutions } from "@/lib/savedInstitutions";
import type { InstitutionRecord } from "@/lib/types";

const MAX_COMPARE = 4;
const ITEMS_PER_PAGE = 6;

interface BrowseSectionProps {
  institutions: InstitutionRecord[];
  onVerify: (institution: InstitutionRecord) => void;
}

export default function BrowseSection({ institutions, onVerify }: BrowseSectionProps) {
  const [province, setProvince] = useState(ALL_PROVINCES_VALUE);
  const [institutionType, setInstitutionType] = useState(ALL_TYPES_VALUE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [savedIds, toggleSaved] = useSavedInstitutions();
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const sectionTopRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => filterInstitutionsForBrowse(institutions, { province, institutionType }),
    [institutions, province, institutionType]
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
    setPage(1);
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

  return (
    <section className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-6xl" ref={sectionTopRef}>
        <BrowseHeader
          resultCount={filtered.length}
          province={province}
          institutionType={institutionType}
          onProvinceChange={handleProvinceChange}
          onInstitutionTypeChange={handleInstitutionTypeChange}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((value) => !value)}
        />

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            No institutions match these filters yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageInstitutions.map((institution) => (
                <BrowseInstitutionCard
                  key={institution.id}
                  institution={institution}
                  saved={savedIds.has(institution.id)}
                  comparing={compareIds.has(institution.id)}
                  compareDisabled={!compareIds.has(institution.id) && compareIds.size >= MAX_COMPARE}
                  onToggleSaved={() => toggleSaved(institution.id)}
                  onToggleCompare={() => toggleCompare(institution.id)}
                  onVerify={() => onVerify(institution)}
                />
              ))}
            </div>

            <BrowsePagination page={currentPage} totalPages={totalPages} onGoToPage={goToPage} />
          </>
        )}
      </div>

      {compareIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg">
            <span className="text-sm font-medium text-foreground">{compareIds.size} selected for comparison</span>
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
                    <td className="py-3 pr-4 text-muted-foreground">
                      {TYPE_LABEL[institution.institutionType] ?? institution.institutionType}
                    </td>
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
    </section>
  );
}
