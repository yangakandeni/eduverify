"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BrowseSection from "@/components/BrowseSection";
import HeroShowcase from "@/components/HeroShowcase";
import InstitutionDetailModal from "@/components/InstitutionDetailModal";
import MultiSearch from "@/components/MultiSearch";
import QualificationBrowser from "@/components/QualificationBrowser";
import Modal from "@/components/ui/Modal";
import { filterByCategory } from "@/lib/categories";
import { getCachedSearchResults, setCachedSearchResults } from "@/lib/searchResultsCache";
import type { InstitutionRecord } from "@/lib/types";

interface SearchState {
  active: boolean;
  status: "idle" | "loading" | "done" | "error";
  query: string;
  results: InstitutionRecord[];
}

const IDLE_SEARCH: SearchState = { active: false, status: "idle", query: "", results: [] };

interface HomeClientProps {
  initialInstitutions: InstitutionRecord[];
  initialQuery?: string;
  initialPage?: number;
}

export default function HomeClient({ initialInstitutions, initialQuery, initialPage }: HomeClientProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [search, setSearch] = useState<SearchState>(() =>
    initialQuery ? { active: true, status: "loading", query: initialQuery, results: [] } : IDLE_SEARCH,
  );
  const [activeCategory, setActiveCategory] = useState("all");
  const [exploreInstitution, setExploreInstitution] = useState<InstitutionRecord | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const hasRunInitialSearch = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (search.active) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [search.active, search.query]);

  // Restores the search on a cold load that arrives with a `?q=` (e.g. the browser's Back
  // button, or the qualifications page's Back link) — see plan for rationale. The ref guard
  // avoids a duplicate /api/search call from React StrictMode's mount→unmount→mount in dev.
  useEffect(() => {
    if (initialQuery && !hasRunInitialSearch.current) {
      hasRunInitialSearch.current = true;
      handleSearch(initialQuery, initialPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps the address bar (and browser history entry) in sync with the active search, so
  // either the qualifications page's explicit Back link or the browser's native Back button
  // can restore these same results — see plan for rationale.
  function syncSearchUrl(term: string, pageForUrl?: number) {
    const params = new URLSearchParams({ q: term });
    if (pageForUrl && pageForUrl > 1) params.set("page", String(pageForUrl));
    router.replace(`/?${params}`, { scroll: false });
  }

  async function handleSearch(rawQuery: string, pageForUrl?: number) {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    syncSearchUrl(trimmed, pageForUrl);

    const cached = getCachedSearchResults(trimmed);
    if (cached) {
      setSearch({ active: true, status: "done", query: trimmed, results: cached });
      return;
    }

    setSearch({ active: true, status: "loading", query: trimmed, results: [] });

    try {
      const response = await fetch(`/api/search?${new URLSearchParams({ q: trimmed })}`);
      const data = await response.json();
      if (data.error === "service_unavailable") {
        setSearch({ active: true, status: "error", query: trimmed, results: [] });
        return;
      }
      const results = data.results ?? [];
      setCachedSearchResults(trimmed, results);
      setSearch({
        active: true,
        status: "done",
        query: trimmed,
        results,
      });
    } catch {
      // No local fallback left post-cutover — a real outage (network failure, or the API
      // route itself throwing) surfaces as a distinct error state, not "zero results".
      setSearch({ active: true, status: "error", query: trimmed, results: [] });
    }
  }

  function handleClear() {
    setQuery("");
    setSearch(IDLE_SEARCH);
    router.replace("/", { scroll: false });
  }

  function handlePageChange(nextPage: number) {
    if (!search.active) return;
    syncSearchUrl(search.query, nextPage);
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
      <div ref={resultsRef} className="scroll-mt-16">
        <BrowseSection
          institutions={browseInstitutions}
          query={search.active ? search.query : undefined}
          loading={search.active && search.status === "loading"}
          error={search.active && search.status === "error"}
          initialPage={initialPage}
          onVerify={setExploreInstitution}
          onClearSearch={handleClear}
          onPageChange={handlePageChange}
          onRetry={() => handleSearch(search.query, initialPage)}
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
