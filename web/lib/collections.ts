import type { InstitutionRecord } from "./types";

export interface Collection {
  key: string;
  title: string;
  /** Institution IDs that should render with a "Sponsored" badge. Always empty today —
   * there's no sponsorship product yet — but slides are built to carry this so a future
   * sponsored slide only needs to populate this set, not change the carousel. */
  sponsoredIds: ReadonlySet<string>;
  institutions: InstitutionRecord[];
}

const COLLECTION_SIZE = 5;

interface CollectionSpec {
  key: string;
  title: string;
  filter?: (institution: InstitutionRecord) => boolean;
  sort: (a: InstitutionRecord, b: InstitutionRecord) => number;
}

function byQualificationCount(a: InstitutionRecord, b: InstitutionRecord): number {
  return b.qualifications.length - a.qualifications.length || a.name.localeCompare(b.name);
}

function byName(a: InstitutionRecord, b: InstitutionRecord): number {
  return a.name.localeCompare(b.name);
}

/** No "added at" timestamp exists on institution data, so recency isn't derivable — this
 * surfaces flagged institutions first as a stand-in, falling back to name order. */
function byFeaturedFirst(a: InstitutionRecord, b: InstitutionRecord): number {
  const aFlag = a.isFeatured || a.isSponsored ? 1 : 0;
  const bFlag = b.isFeatured || b.isSponsored ? 1 : 0;
  return bFlag - aFlag || byQualificationCount(a, b);
}

const COLLECTION_SPECS: CollectionSpec[] = [
  { key: "recommended", title: "Recommended", sort: byQualificationCount },
  { key: "featured", title: "Featured", sort: byFeaturedFirst },
  { key: "recently-added", title: "Recently Added", sort: byName },
];

/**
 * Builds the carousel's curated slides. Each slide pulls from institutions not already
 * used by an earlier slide, so paging the carousel swaps in a genuinely different group
 * rather than recycling the same few institutions — falling back to the full matching
 * pool only if there aren't enough unused institutions left (small/filtered datasets).
 */
export function buildCollections(institutions: InstitutionRecord[], size = COLLECTION_SIZE): Collection[] {
  const used = new Set<string>();
  const collections: Collection[] = [];

  for (const spec of COLLECTION_SPECS) {
    const pool = (spec.filter ? institutions.filter(spec.filter) : institutions).slice().sort(spec.sort);
    const unused = pool.filter((institution) => !used.has(institution.id));
    const picked = (unused.length >= size ? unused : pool).slice(0, size);
    if (picked.length === 0) continue;

    picked.forEach((institution) => used.add(institution.id));
    collections.push({ key: spec.key, title: spec.title, sponsoredIds: new Set(), institutions: picked });
  }

  return collections;
}
