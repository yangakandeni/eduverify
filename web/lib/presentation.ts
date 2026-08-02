import type { InstitutionRecord, InstitutionType } from "./types";

const STOPWORDS = new Set(["of", "the", "and", "for", "a", "an", "in"]);

export const TYPE_LABEL: Record<InstitutionType, string> = {
  "Public University": "Public University",
  "Private Higher Education Institution": "Private Institution",
  "TVET College": "TVET College",
};

/** Two-letter monogram used for the placeholder logo avatar, e.g. "University of Cape Town" -> "UC". */
export function getInitials(name: string): string {
  const words = name
    .replace(/\([^)]*\)/g, "")
    .split(/\s+/)
    .filter((word) => word && !STOPWORDS.has(word.toLowerCase()));

  const letters = words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "");
  const initials = letters.join("");
  return initials || name.slice(0, 2).toUpperCase();
}

const AVATAR_PALETTES = [
  "bg-emerald-50 text-emerald-700",
  "bg-sky-50 text-sky-700",
  "bg-violet-50 text-violet-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-indigo-50 text-indigo-700",
  "bg-teal-50 text-teal-700",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarPalette(seed: string): string {
  return AVATAR_PALETTES[hashString(seed) % AVATAR_PALETTES.length];
}

export interface StatusBadge {
  label: string;
  verified: boolean;
}

/** Derives a display badge from the raw register status; provisional institutions are
 * called out explicitly rather than folded into "Registered" — this is a verification
 * tool, so overstating a provisional status would defeat its purpose. */
export function getStatusBadge(institution: InstitutionRecord): StatusBadge {
  const rawStatus = (institution.status ?? "").toLowerCase();

  if (rawStatus.includes("provisional")) {
    return { label: "Provisionally Registered", verified: false };
  }

  const isPublic = institution.institutionType === "Public University" || institution.institutionType === "TVET College";
  return { label: isPublic ? "Registered Public" : "Registered Private", verified: true };
}

export function getShortDescription(institution: InstitutionRecord): string {
  const typeLabel = TYPE_LABEL[institution.institutionType] ?? institution.institutionType;
  const province = institution.province && institution.province !== "Unknown" ? ` in ${institution.province}` : "";
  const qualCount = institution.qualifications.length;
  const qualPhrase = qualCount > 0 ? `${qualCount} accredited qualification${qualCount === 1 ? "" : "s"}` : "qualification details on request";
  return `${typeLabel}${province}, offering ${qualPhrase}.`;
}

/** Featured selection is deterministic (by qualification count, then name) rather than
 * random, so the hero looks the same on every render/refresh until the data changes. */
export function selectFeatured(institutions: InstitutionRecord[], count = 5): InstitutionRecord[] {
  return [...institutions]
    .sort((a, b) => b.qualifications.length - a.qualifications.length || a.name.localeCompare(b.name))
    .slice(0, count);
}
