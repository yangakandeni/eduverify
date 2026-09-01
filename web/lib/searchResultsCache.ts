import type { InstitutionRecord } from "@/lib/types";

// Session-scoped (survives client-side back/forward navigation, cleared when the tab closes)
// so re-visiting the home page with a query already searched this session skips the network
// call instead of re-fetching results the user already saw.
const STORAGE_KEY_PREFIX = "eduverify:search-cache:";

function storageKey(query: string): string {
  return `${STORAGE_KEY_PREFIX}${query}`;
}

export function getCachedSearchResults(query: string): InstitutionRecord[] | null {
  try {
    const raw = sessionStorage.getItem(storageKey(query));
    return raw ? (JSON.parse(raw) as InstitutionRecord[]) : null;
  } catch {
    return null;
  }
}

export function setCachedSearchResults(query: string, results: InstitutionRecord[]): void {
  try {
    sessionStorage.setItem(storageKey(query), JSON.stringify(results));
  } catch {
    // sessionStorage unavailable (private browsing, quota) — caching is a nice-to-have, skip it
  }
}

export function clearSearchResultsCache(): void {
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(STORAGE_KEY_PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
}
