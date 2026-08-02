import type { Institution } from "./types";

const COMBINING_MARKS = /[̀-ͯ]/g;

/** Mirrors parser/dynamo_item.py so PKs computed here match what's actually seeded into DynamoDB. */
function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

export function institutionKey(
  institution: Pick<Institution, "name" | "registration_number">
): string {
  if (institution.registration_number) {
    return `INST#${institution.registration_number}`;
  }
  return `INST#NAME#${slugify(institution.name)}`;
}
