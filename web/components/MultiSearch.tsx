"use client";

import { ArrowRight, GraduationCap, Loader2, MapPin, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAllProgrammes } from "@/lib/facultiesAndProgrammes";
import { getDisplayName } from "@/lib/presentation";
import { normalizeProvince } from "@/lib/normalize";
import type { QualificationSearchHit } from "@/lib/qualificationsData";
import type { InstitutionRecord } from "@/lib/types";

interface MultiSearchProps {
  institutions: InstitutionRecord[];
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
  loading?: boolean;
}

const POPULAR_SEARCHES = ["Nursing", "Teaching", "IT", "Engineering", "Accounting", "Law"];

export default function MultiSearch({ institutions, value, onValueChange, onSearch, onClear, loading }: MultiSearchProps) {
  const [suggestions, setSuggestions] = useState<InstitutionRecord[]>([]);
  const [qualificationSuggestions, setQualificationSuggestions] = useState<QualificationSearchHit[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const qualificationCount = institutions.reduce((total, institution) => total + getAllProgrammes(institution).length, 0);
    const provinceCount = new Set(
      institutions.map((institution) => normalizeProvince(institution.province)).filter((province) => province !== "Unknown")
    ).size;

    return {
      institutionCount: institutions.length,
      qualificationCount,
      provinceCount,
    };
  }, [institutions]);

  useEffect(() => {
    const trimmed = value.trim();

    const handle = setTimeout(() => {
      if (!trimmed) {
        setSuggestions([]);
        setQualificationSuggestions([]);
        return;
      }

      fetch(`/api/search?${new URLSearchParams({ q: trimmed, mode: "typeahead" })}`)
        .then((res) => res.json())
        .then((data) => {
          setSuggestions(data.results ?? []);
          setQualificationSuggestions(data.qualificationHits ?? []);
        })
        .catch(() => {
          setSuggestions([]);
          setQualificationSuggestions([]);
        });
    }, 200);

    return () => clearTimeout(handle);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function runSearch(query: string) {
    setShowSuggestions(false);
    const trimmed = query.trim();
    onValueChange(trimmed);
    if (!trimmed) {
      onClear();
      return;
    }
    onSearch(trimmed);
  }

  return (
    <section className="relative bg-primary px-6 py-16 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
          Verify before you <span className="text-accent">enrol.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/60">
          Search DHET- and SAQA-registered institutions and accredited qualifications.
        </p>

        <div ref={containerRef} className="relative mx-auto mt-10 max-w-2xl text-left">
          <div className="flex items-stretch gap-2 rounded-2xl bg-white p-2 shadow-2xl">
            <div className="flex items-center pl-3 text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch(value);
              }}
              placeholder="Search by institution, qualification, or province..."
              className="w-full min-w-0 bg-transparent px-1 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {value && (
              <button
                type="button"
                onClick={() => runSearch("")}
                aria-label="Clear search"
                className="flex flex-shrink-0 items-center px-1 text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => runSearch(value)}
              disabled={loading}
              className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Search
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {showSuggestions && (suggestions.length > 0 || qualificationSuggestions.length > 0) && (
            <ul className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-card text-foreground shadow-xl">
              {suggestions.map((institution) => (
                <li key={institution.id}>
                  <button
                    type="button"
                    onClick={() => runSearch(getDisplayName(institution.name, institution.tradingName))}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary"
                  >
                    <span className="font-medium">{getDisplayName(institution.name, institution.tradingName)}</span>
                    {institution.province && institution.province !== "Unknown" && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {institution.province}
                      </span>
                    )}
                  </button>
                </li>
              ))}
              {qualificationSuggestions.length > 0 && (
                <li className="border-t border-border px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Programmes
                </li>
              )}
              {qualificationSuggestions.map(({ qualification, institution }) => (
                <li key={qualification.qualId}>
                  <a
                    href={`/institutions/${institution.id}/qualifications?${new URLSearchParams({
                      faculty: qualification.subfield,
                    }).toString()}`}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <GraduationCap className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      {qualification.title}
                    </span>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {getDisplayName(institution.name, institution.tradingName)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => runSearch(term)}
              className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/70 transition hover:bg-white/20 hover:text-white"
            >
              {term}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4">
          <StatCard value={`${stats.institutionCount}+`} label="Institutions" />
          <StatCard value={`${stats.qualificationCount.toLocaleString()}+`} label="Qualifications" />
          <StatCard value={`${stats.provinceCount}`} label="Provinces" />
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
      <p className="font-display text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-white/60">{label}</p>
    </div>
  );
}
