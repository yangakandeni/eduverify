"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import HeroShowcase from "@/components/HeroShowcase";
import InstitutionCard from "@/components/InstitutionCard";
import InstitutionGrid from "@/components/InstitutionGrid";
import MultiSearch from "@/components/MultiSearch";
import NotFoundCard from "@/components/NotFoundCard";
import QualificationBrowser from "@/components/QualificationBrowser";
import Modal from "@/components/ui/Modal";
import { filterByCategory } from "@/lib/categories";
import type { InstitutionRecord } from "@/lib/types";

interface SearchState {
  active: boolean;
  status: "idle" | "loading" | "done";
  query: string;
  results: InstitutionRecord[];
  notFound: boolean;
}

const IDLE_SEARCH: SearchState = { active: false, status: "idle", query: "", results: [], notFound: false };

export default function Home() {
  const [allInstitutions, setAllInstitutions] = useState<InstitutionRecord[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>(IDLE_SEARCH);
  const [activeCategory, setActiveCategory] = useState("all");
  const [exploreInstitution, setExploreInstitution] = useState<InstitutionRecord | null>(null);

  useEffect(() => {
    fetch("/api/institutions")
      .then((response) => response.json())
      .then((data) => setAllInstitutions(data.institutions ?? []))
      .catch(() => setAllInstitutions([]))
      .finally(() => setLoadingAll(false));
  }, []);

  async function handleSearch(rawQuery: string) {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    setSearch({ active: true, status: "loading", query: trimmed, results: [], notFound: false });

    try {
      const response = await fetch(`/api/search?${new URLSearchParams({ q: trimmed })}`);
      const data = await response.json();
      setSearch({
        active: true,
        status: "done",
        query: trimmed,
        results: data.results ?? [],
        notFound: Boolean(data.notFound),
      });
    } catch {
      setSearch({ active: true, status: "done", query: trimmed, results: [], notFound: true });
    }
  }

  function handleClear() {
    setQuery("");
    setSearch(IDLE_SEARCH);
  }

  const browseInstitutions = filterByCategory(allInstitutions, activeCategory);

  return (
    <main className="flex flex-1 flex-col bg-white">
      <MultiSearch
        value={query}
        onValueChange={setQuery}
        onSearch={handleSearch}
        onClear={handleClear}
        loading={search.status === "loading"}
      />

      {search.active ? (
        <section className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-3xl">
            <button
              type="button"
              onClick={handleClear}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to browsing
            </button>

            {search.status === "loading" ? (
              <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Checking the register...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  {search.notFound
                    ? `No results for "${search.query}"`
                    : `${search.results.length} result${search.results.length === 1 ? "" : "s"} for "${search.query}"`}
                </p>

                {search.notFound ? (
                  <NotFoundCard query={search.query} />
                ) : (
                  search.results.map((institution) => (
                    <InstitutionCard key={institution.id} institution={institution} />
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {loadingAll ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Loading the discovery portal...</p>
            </div>
          ) : (
            <>
              <HeroShowcase institutions={allInstitutions} onExplore={setExploreInstitution} />
              <QualificationBrowser activeCategory={activeCategory} onChange={setActiveCategory} />
              <section className="flex-1 px-6 py-8">
                <div className="mx-auto max-w-6xl">
                  <InstitutionGrid institutions={browseInstitutions} onExplore={setExploreInstitution} />
                </div>
              </section>
            </>
          )}
        </>
      )}

      <Modal
        open={exploreInstitution !== null}
        onClose={() => setExploreInstitution(null)}
        title={exploreInstitution?.name ?? "Institution"}
        widthClassName="max-w-2xl"
      >
        {exploreInstitution && <InstitutionCard institution={exploreInstitution} />}
      </Modal>
    </main>
  );
}
