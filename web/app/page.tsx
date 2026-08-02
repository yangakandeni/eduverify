"use client";

import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import InstitutionCard from "@/components/InstitutionCard";
import NotFoundCard from "@/components/NotFoundCard";
import SearchHeader, { type SearchFilterState } from "@/components/SearchHeader";
import type { InstitutionRecord } from "@/lib/types";

interface SearchState {
  status: "idle" | "loading" | "done";
  query: string;
  results: InstitutionRecord[];
  notFound: boolean;
}

export default function Home() {
  const [state, setState] = useState<SearchState>({
    status: "idle",
    query: "",
    results: [],
    notFound: false,
  });

  async function handleSearch(query: string, filters: SearchFilterState) {
    const trimmed = query.trim();
    if (!trimmed) return;

    setState({ status: "loading", query: trimmed, results: [], notFound: false });

    const params = new URLSearchParams({ q: trimmed });
    if (filters.province) params.set("province", filters.province);
    if (filters.status) params.set("status", filters.status);

    try {
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      setState({
        status: "done",
        query: trimmed,
        results: data.results ?? [],
        notFound: Boolean(data.notFound),
      });
    } catch {
      setState({ status: "done", query: trimmed, results: [], notFound: true });
    }
  }

  return (
    <main className="flex flex-1 flex-col">
      <SearchHeader onSearch={handleSearch} loading={state.status === "loading"} />

      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        {state.status === "idle" && (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-400">
            <Search className="h-8 w-8" />
            <p>Search for an institution name or registration number to get started.</p>
          </div>
        )}

        {state.status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Checking the register...</p>
          </div>
        )}

        {state.status === "done" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              {state.notFound
                ? `No results for "${state.query}"`
                : `${state.results.length} result${state.results.length === 1 ? "" : "s"} for "${state.query}"`}
            </p>

            {state.notFound ? (
              <NotFoundCard query={state.query} />
            ) : (
              state.results.map((institution) => (
                <InstitutionCard key={institution.id} institution={institution} />
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}
