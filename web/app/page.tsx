"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BrowseSection from "@/components/BrowseSection";
import HeroShowcase from "@/components/HeroShowcase";
import InstitutionDetailModal from "@/components/InstitutionDetailModal";
import MultiSearch from "@/components/MultiSearch";
import QualificationBrowser from "@/components/QualificationBrowser";
import Modal from "@/components/ui/Modal";
import { filterByCategory } from "@/lib/categories";
import type { InstitutionRecord } from "@/lib/types";

interface SearchState {
  active: boolean;
  status: "idle" | "loading" | "done";
  query: string;
  results: InstitutionRecord[];
}

const IDLE_SEARCH: SearchState = { active: false, status: "idle", query: "", results: [] };

export default function Home() {
  const [allInstitutions, setAllInstitutions] = useState<InstitutionRecord[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>(IDLE_SEARCH);
  const [activeCategory, setActiveCategory] = useState("all");
  const [exploreInstitution, setExploreInstitution] = useState<InstitutionRecord | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/institutions")
      .then((response) => response.json())
      .then((data) => setAllInstitutions(data.institutions ?? []))
      .catch(() => setAllInstitutions([]))
      .finally(() => setLoadingAll(false));
  }, []);

  useEffect(() => {
    if (search.active && !loadingAll) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [search.active, search.query, loadingAll]);

  async function handleSearch(rawQuery: string) {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    setSearch({ active: true, status: "loading", query: trimmed, results: [] });

    try {
      const response = await fetch(`/api/search?${new URLSearchParams({ q: trimmed })}`);
      const data = await response.json();
      setSearch({ active: true, status: "done", query: trimmed, results: data.results ?? [] });
    } catch {
      setSearch({ active: true, status: "done", query: trimmed, results: [] });
    }
  }

  function handleClear() {
    setQuery("");
    setSearch(IDLE_SEARCH);
  }

  const browseInstitutions = search.active ? search.results : filterByCategory(allInstitutions, activeCategory);

  return (
    <main className="flex flex-1 flex-col bg-background">
      <MultiSearch
        institutions={allInstitutions}
        value={query}
        onValueChange={setQuery}
        onSearch={handleSearch}
        onClear={handleClear}
        loading={search.status === "loading"}
      />

      {loadingAll ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading the discovery portal...</p>
        </div>
      ) : (
        <>
          <HeroShowcase institutions={allInstitutions} onExplore={setExploreInstitution} />
          <QualificationBrowser activeCategory={activeCategory} onChange={setActiveCategory} />
          <div ref={resultsRef} className="scroll-mt-16">
            <BrowseSection
              institutions={browseInstitutions}
              query={search.active ? search.query : undefined}
              loading={search.active && search.status === "loading"}
              onVerify={setExploreInstitution}
              onClearSearch={handleClear}
            />
          </div>
        </>
      )}

      <Modal
        open={exploreInstitution !== null}
        onClose={() => setExploreInstitution(null)}
        title={exploreInstitution?.name ?? "Institution"}
        widthClassName="max-w-2xl"
        hideHeader
      >
        {exploreInstitution && (
          <InstitutionDetailModal institution={exploreInstitution} onClose={() => setExploreInstitution(null)} />
        )}
      </Modal>
    </main>
  );
}
