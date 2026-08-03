"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  ALL_PROVINCES_VALUE,
  ALL_STATUSES_VALUE,
  ALL_TYPES_VALUE,
  INSTITUTION_TYPE_OPTIONS,
  STATUS_OPTIONS,
  getResultCountLabel,
} from "@/lib/browse";
import { CANONICAL_PROVINCES } from "@/lib/normalize";

interface BrowseHeaderProps {
  resultCount: number;
  province: string;
  institutionType: string;
  status: string;
  onProvinceChange: (value: string) => void;
  onInstitutionTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
}

export default function BrowseHeader({
  resultCount,
  province,
  institutionType,
  status,
  onProvinceChange,
  onInstitutionTypeChange,
  onStatusChange,
  filtersOpen,
  onToggleFilters,
}: BrowseHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Institution Directory</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground">Browse All Institutions</h1>
          <p className="mt-1 text-sm text-muted-foreground">{getResultCountLabel(resultCount)}</p>
        </div>

        <button
          type="button"
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {filtersOpen && (
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Province
            </span>
            <select
              value={province}
              onChange={(event) => onProvinceChange(event.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={ALL_PROVINCES_VALUE}>All Provinces</option>
              {CANONICAL_PROVINCES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Institution Type
            </span>
            <select
              value={institutionType}
              onChange={(event) => onInstitutionTypeChange(event.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={ALL_TYPES_VALUE}>All Types</option>
              {INSTITUTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </span>
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={ALL_STATUSES_VALUE}>All Statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
