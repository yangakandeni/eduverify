const COMBINING_MARKS = /[̀-ͯ]/g;

/** Mirrors eduverify-api's src/lib/keys.ts (a separate repo) so ids computed here match
 * what eduverify-api returns for the same institution. If this slugify algorithm ever
 * changes, both locations must change together. */
function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

export function institutionKey(institution: { name: string; registration_number?: string | null }): string {
  if (institution.registration_number) {
    return `INST#${institution.registration_number}`;
  }
  return `INST#NAME#${slugify(institution.name)}`;
}
