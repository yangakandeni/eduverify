"use client";

import { useEffect, useRef, useState } from "react";
import BrowseSection from "@/components/BrowseSection";
import HeroShowcase from "@/components/HeroShowcase";
import InstitutionDetailModal from "@/components/InstitutionDetailModal";
import MultiSearch from "@/components/MultiSearch";
import QualificationBrowser from "@/components/QualificationBrowser";
import QualificationSearchResults from "@/components/qualifications/QualificationSearchResults";
import Modal from "@/components/ui/Modal";
import { filterByCategory } from "@/lib/categories";
import type { QualificationSearchHit } from "@/lib/qualificationsData";
import type { InstitutionRecord } from "@/lib/types";

interface SearchState {
  active: boolean;
  status: "idle" | "loading" | "done";
  query: string;
  results: InstitutionRecord[];
  qualificationHits: QualificationSearchHit[];
}

const IDLE_SEARCH: SearchState = { active: false, status: "idle", query: "", results: [], qualificationHits: [] };

interface HomeClientProps {
  initialInstitutions: InstitutionRecord[];
}

export default function HomeClient({ initialInstitutions }: HomeClientProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>(IDLE_SEARCH);
  const [activeCategory, setActiveCategory] = useState("all");
  const [exploreInstitution, setExploreInstitution] = useState<InstitutionRecord | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (search.active) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [search.active, search.query]);

  async function handleSearch(rawQuery: string) {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    setSearch({ active: true, status: "loading", query: trimmed, results: [], qualificationHits: [] });

    try {
      const response = await fetch(`/api/search?${new URLSearchParams({ q: trimmed })}`);
      const data = await response.json();
      setSearch({
        active: true,
        status: "done",
        query: trimmed,
        results: data.results ?? [],
        qualificationHits: data.qualificationHits ?? [],
      });
    } catch {
      setSearch({ active: true, status: "done", query: trimmed, results: [], qualificationHits: [] });
    }
  }

  function handleClear() {
    setQuery("");
    setSearch(IDLE_SEARCH);
  }

  const browseInstitutions = search.active
    ? search.results
    : filterByCategory(initialInstitutions, activeCategory);

  return (
    <main className="flex flex-1 flex-col bg-background">
      <MultiSearch
        institutions={initialInstitutions}
        value={query}
        onValueChange={setQuery}
        onSearch={handleSearch}
        onClear={handleClear}
        loading={search.status === "loading"}
      />

      <HeroShowcase institutions={initialInstitutions} onExplore={setExploreInstitution} />
      <QualificationBrowser activeCategory={activeCategory} onChange={setActiveCategory} />
      {search.active && search.status === "done" && (
        <QualificationSearchResults hits={search.qualificationHits} />
      )}
      <div ref={resultsRef} className="scroll-mt-16">
        <BrowseSection
          institutions={browseInstitutions}
          query={search.active ? search.query : undefined}
          loading={search.active && search.status === "loading"}
          onVerify={setExploreInstitution}
          onClearSearch={handleClear}
        />
      </div>

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
