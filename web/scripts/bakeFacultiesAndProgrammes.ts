import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { groupBySubfield } from "../lib/facultiesAndProgrammes";
import { institutionKey } from "../lib/keys";
import { matchQualificationsToInstitutions } from "../lib/qualificationsMatching";
import type { FacultyProgrammes, SaqaQualification } from "../lib/types";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const INSTITUTIONS_PATH = path.join(REPO_ROOT, "data/institutions.json");
const QUALIFICATIONS_PATH = path.join(REPO_ROOT, "data/qualifications.json");
const PUBLIC_UNIVERSITIES_PATH = path.join(REPO_ROOT, "web/lib/data/public_universities.json");
const PUBLIC_TVETS_PATH = path.join(REPO_ROOT, "web/lib/data/public_tvets.json");

interface NamedRecord {
  name: string;
  registration_number?: string | null;
  [key: string]: unknown;
}

/** Builds each record's {faculty, programmes}[], keyed via the same institutionKey() that
 * localData.ts/publicUniversities.ts/publicTvets.ts use at load time — this makes duplicate
 * DHET rows (same registration number) collapse onto one id, so they get identical matched
 * programmes rather than one winning arbitrarily inside normalizeForMatch's internal map. */
function matchAll(records: NamedRecord[], saqaRows: SaqaQualification[]): FacultyProgrammes[][] {
  const withIds = records.map((record) => ({ id: institutionKey(record), name: record.name }));
  const matched = matchQualificationsToInstitutions(withIds, saqaRows);
  return withIds.map((r) => groupBySubfield(matched.get(r.id) ?? []));
}

export function bakeInstitutions(records: NamedRecord[], saqaRows: SaqaQualification[]) {
  const grouped = matchAll(records, saqaRows);
  return records.map((r, i) => ({
    name: r.name,
    registration_number: r.registration_number,
    status: r.status,
    address: r.address,
    province: r.province,
    contacts: r.contacts,
    faculties_and_programmes: grouped[i],
    cancellation_reason: r.cancellation_reason,
  }));
}

export function bakePublicUniversities(records: NamedRecord[], saqaRows: SaqaQualification[]) {
  const grouped = matchAll(records, saqaRows);
  return records.map((r, i) => ({
    name: r.name,
    abbreviation: r.abbreviation,
    address: r.address,
    province: r.province,
    website: r.website,
    faculties_and_programmes: grouped[i],
  }));
}

export function bakePublicTvets(records: NamedRecord[], saqaRows: SaqaQualification[]) {
  const grouped = matchAll(records, saqaRows);
  return records.map((r, i) => ({
    name: r.name,
    abbreviation: r.abbreviation,
    address: r.address,
    province: r.province,
    website: r.website,
    faculties_and_programmes: grouped[i],
  }));
}

function main() {
  const saqaRows: SaqaQualification[] = JSON.parse(readFileSync(QUALIFICATIONS_PATH, "utf8"));

  const institutions = JSON.parse(readFileSync(INSTITUTIONS_PATH, "utf8"));
  writeFileSync(INSTITUTIONS_PATH, JSON.stringify(bakeInstitutions(institutions, saqaRows), null, 2) + "\n");

  const universities = JSON.parse(readFileSync(PUBLIC_UNIVERSITIES_PATH, "utf8"));
  writeFileSync(
    PUBLIC_UNIVERSITIES_PATH,
    JSON.stringify(bakePublicUniversities(universities, saqaRows), null, 2) + "\n",
  );

  const tvets = JSON.parse(readFileSync(PUBLIC_TVETS_PATH, "utf8"));
  writeFileSync(PUBLIC_TVETS_PATH, JSON.stringify(bakePublicTvets(tvets, saqaRows), null, 2) + "\n");

  console.log("Baked faculties_and_programmes into institutions.json, public_universities.json, public_tvets.json.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
