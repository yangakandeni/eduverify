const DIACRITICS = /[̀-ͯ]/g;

export function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeRegistrationNumber(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

export const CANONICAL_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;

export type CanonicalProvince = (typeof CANONICAL_PROVINCES)[number];

/** Source register data has inconsistent casing, embedded newlines, and OCR typos for province names. */
export function normalizeProvince(raw: string | null | undefined): string {
  if (!raw) return "Unknown";
  const cleaned = normalizeText(raw);

  if (cleaned.includes("kwazulu") || cleaned.includes("kwa zulu") || cleaned.includes("natal")) {
    return "KwaZulu-Natal";
  }
  if (cleaned.includes("eastern cape")) return "Eastern Cape";
  if (cleaned.includes("western cape")) return "Western Cape";
  if (cleaned.includes("northern cape")) return "Northern Cape";
  if (cleaned.includes("north west") || cleaned.includes("nort west") || cleaned.includes("northwest")) {
    return "North West";
  }
  if (cleaned.includes("free state")) return "Free State";
  if (cleaned.includes("gauteng")) return "Gauteng";
  if (cleaned.includes("limpopo")) return "Limpopo";
  if (cleaned.includes("mpumalanga")) return "Mpumalanga";

  return "Unknown";
}
