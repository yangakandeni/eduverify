import type { InstitutionRecord } from "./types";

export interface Collection {
  key: string;
  title: string;
  institutions: InstitutionRecord[];
}

function isPublicType(institution: InstitutionRecord): boolean {
  return institution.institutionType === "Public University" || institution.institutionType === "TVET College";
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

/** Recommended ranks by monetization/civic priority: local sponsored partners first
 * (no sponsorship product exists yet, so this tier is empty today), then local public
 * universities & TVETs (the Day 1 default), then local registered private institutions. */
function tierRank(institution: InstitutionRecord): number {
  if (institution.isSponsored) return 0;
  return isPublicType(institution) ? 1 : 2;
}

function byRecommendedPriority(a: InstitutionRecord, b: InstitutionRecord): number {
  return tierRank(a) - tierRank(b) || byQualificationCount(a, b);
}

/**
 * Builds the Recommended list for a province: institutions physically located there,
 * ranked sponsored-first, then public, then private. Falls back to the full nationwide
 * pool (same ranking) when the province has no matches, so Recommended is never empty
 * just because a visitor's detected province happens to be sparse in our data.
 */
export function buildRecommended(institutions: InstitutionRecord[], province: string): InstitutionRecord[] {
  const local = institutions.filter((institution) => institution.province === province);
  const pool = local.length > 0 ? local : institutions;
  return [...pool].sort(byRecommendedPriority);
}

/**
 * Builds the hero's tabs. Recommended is always present (per spec). Featured and
 * Recently Added are omitted entirely when no institution qualifies, rather than
 * rendering an empty tab.
 */
export function buildCollections(institutions: InstitutionRecord[], province: string): Collection[] {
  const collections: Collection[] = [
    { key: "recommended", title: "Recommended", institutions: buildRecommended(institutions, province) },
  ];

  const featuredPool = institutions.filter((institution) => institution.isSponsored || institution.isFeatured);
  if (featuredPool.length > 0) {
    collections.push({ key: "featured", title: "Featured", institutions: [...featuredPool].sort(byFeaturedFirst) });
  }

  const recentPool = institutions.filter((institution) => institution.isRecentlyAdded);
  if (recentPool.length > 0) {
    collections.push({ key: "recently-added", title: "Recently Added", institutions: [...recentPool].sort(byName) });
  }

  return collections;
}

/** Splits a list into fixed-size slides for the carousel, e.g. chunk([...12 items], 5)
 * -> 3 slides of 5, 5, 2. */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
