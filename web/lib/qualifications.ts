import type { Qualification } from "./types";

const NUMBERING_PATTERN = /^\s*\d+\)\s*/;
const NQF_PATTERN = /NQF level\s*(\d+)/i;
const CREDITS_PATTERN = /(\d+)[- ]?Credits/i;
const MODE_PATTERN = /:\s*([A-Za-z][A-Za-z\s]*Mode)/i;
const CAMPUS_PATTERN = /\[([^\]]+)\]\s*$/;
const SAQA_PATTERN = /SAQA\s*(?:ID)?\s*[:#]?\s*(\d+)/i;
const PAREN_PATTERN = /\(([^)]*)\)/;

/** Parses the raw scraped DHET qualification strings, e.g. "1) Higher Certificate in Digital
 * Marketing (NQF level 5, 120-Credits: Distance Mode) [A]", into structured fields. */
export function parseQualification(raw: string): Qualification {
  let text = raw.trim();

  const campusMatch = text.match(CAMPUS_PATTERN);
  const campuses = campusMatch ? campusMatch[1].trim() : undefined;
  if (campusMatch) text = text.slice(0, campusMatch.index).trim();

  const saqaMatch = text.match(SAQA_PATTERN);
  const saqaId = saqaMatch ? saqaMatch[1] : undefined;

  const parenMatch = text.match(PAREN_PATTERN);
  const detail = parenMatch ? parenMatch[1] : "";
  const title = (parenMatch ? text.slice(0, parenMatch.index) : text).replace(NUMBERING_PATTERN, "").trim();

  const nqfMatch = detail.match(NQF_PATTERN);
  const nqfLevel = nqfMatch ? Number(nqfMatch[1]) : undefined;

  const creditsMatch = detail.match(CREDITS_PATTERN);
  const credits = creditsMatch ? Number(creditsMatch[1]) : undefined;

  const modeMatch = detail.match(MODE_PATTERN);
  const mode = modeMatch ? modeMatch[1].trim() : undefined;

  return { title: title || raw.trim(), nqfLevel, credits, mode, saqaId, campuses };
}
