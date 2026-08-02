"use client";

import { Search, MapPin, ShieldCheck, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CANONICAL_PROVINCES } from "@/lib/normalize";
import type { InstitutionRecord } from "@/lib/types";

export interface SearchFilterState {
  province: string;
  status: string;
}

interface SearchHeaderProps {
  onSearch: (query: string, filters: SearchFilterState) => void;
  loading?: boolean;
}

const REGISTRATION_TYPES = ["Registered", "Provisionally Registered"];

export default function SearchHeader({ onSearch, loading }: SearchHeaderProps) {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("");
  const [status, setStatus] = useState("");
  const [suggestions, setSuggestions] = useState<InstitutionRecord[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();

    const handle = setTimeout(() => {
      if (!trimmed) {
        setSuggestions([]);
        return;
      }

      const params = new URLSearchParams({ q: trimmed, mode: "typeahead" });
      if (province) params.set("province", province);
      if (status) params.set("status", status);

      fetch(`/api/search?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => setSuggestions(data.results ?? []))
        .catch(() => setSuggestions([]));
    }, 200);

    return () => clearTimeout(handle);
  }, [query, province, status]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function runSearch(value: string) {
    setShowSuggestions(false);
    onSearch(value, { province, status });
  }

  return (
    <header className="bg-gradient-to-b from-emerald-700 to-emerald-600 px-6 py-16 text-white sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
          <ShieldCheck className="h-4 w-4" />
          Official DHET register lookup
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">EduVerify</h1>
        <p className="mx-auto mt-3 max-w-xl text-emerald-50">
          Check whether a private higher education institution is registered with South
          Africa&apos;s Department of Higher Education and Training.
        </p>

        <div ref={containerRef} className="relative mt-8 text-left">
          <div className="flex items-stretch overflow-hidden rounded-xl bg-white shadow-lg">
            <div className="flex items-center pl-4 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch(query);
              }}
              placeholder="Search by institution name or registration number..."
              className="w-full px-3 py-4 text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => runSearch(query)}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 px-6 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl bg-white text-slate-900 shadow-xl">
              {suggestions.map((institution) => (
                <li key={institution.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(institution.name);
                      runSearch(institution.name);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-emerald-50"
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

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-left">
          <select
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark]"
          >
            <option value="">All provinces</option>
            {CANONICAL_PROVINCES.map((p) => (
              <option key={p} value={p} className="text-slate-900">
                {p}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark]"
          >
            <option value="">All registration types</option>
            {REGISTRATION_TYPES.map((t) => (
              <option key={t} value={t} className="text-slate-900">
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
