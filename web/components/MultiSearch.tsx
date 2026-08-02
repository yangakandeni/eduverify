"use client";

import { GraduationCap, Loader2, MapPin, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { InstitutionRecord } from "@/lib/types";

interface MultiSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
  loading?: boolean;
}

const POPULAR_SEARCHES = ["Computer Science", "Engineering", "Nursing", "Teaching", "Western Cape"];

export default function MultiSearch({ value, onValueChange, onSearch, onClear, loading }: MultiSearchProps) {
  const [suggestions, setSuggestions] = useState<InstitutionRecord[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = value.trim();

    const handle = setTimeout(() => {
      if (!trimmed) {
        setSuggestions([]);
        return;
      }

      fetch(`/api/search?${new URLSearchParams({ q: trimmed, mode: "typeahead" })}`)
        .then((res) => res.json())
        .then((data) => setSuggestions(data.results ?? []))
        .catch(() => setSuggestions([]));
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
    <section className="border-b border-slate-200 bg-white px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
          <GraduationCap className="h-4 w-4" />
          Higher Education Discovery Portal
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">EduVerify</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Search by institution, qualification, or province to discover and verify South
          Africa&apos;s registered higher education providers.
        </p>

        <div ref={containerRef} className="relative mt-8 text-left">
          <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100">
            <div className="flex items-center pl-4 text-slate-400">
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
              placeholder="Try an institution, a qualification, or a province..."
              className="w-full px-3 py-4 text-slate-900 outline-none placeholder:text-slate-400"
            />
            {value && (
              <button
                type="button"
                onClick={() => runSearch("")}
                aria-label="Clear search"
                className="flex items-center px-2 text-slate-400 transition hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => runSearch(value)}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 px-6 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-100 bg-white text-slate-900 shadow-xl">
              {suggestions.map((institution) => (
                <li key={institution.id}>
                  <button
                    type="button"
                    onClick={() => runSearch(institution.name)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <span className="font-medium">{institution.name}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {institution.province}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => runSearch(term)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
