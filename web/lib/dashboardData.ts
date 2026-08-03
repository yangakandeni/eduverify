import { clerkClient } from "@clerk/nextjs/server";
import { getInstitution } from "./institutions";
import type { InstitutionRecord } from "./types";

export interface SavedInstitution {
  institutionId: string;
  savedAt: string;
}

export interface SavedInstitutionRecord {
  institution: InstitutionRecord;
  savedAt: string;
}

interface SavedInstitutionsPrivateMetadata {
  savedInstitutions?: SavedInstitution[];
}

export function withSavedInstitution(
  saved: SavedInstitution[],
  institutionId: string,
  savedAt: string,
): SavedInstitution[] {
  if (saved.some((entry) => entry.institutionId === institutionId)) return saved;
  return [...saved, { institutionId, savedAt }];
}

export function withoutSavedInstitution(saved: SavedInstitution[], institutionId: string): SavedInstitution[] {
  return saved.filter((entry) => entry.institutionId !== institutionId);
}

export function sortSavedInstitutionsByRecency(saved: SavedInstitution[]): SavedInstitution[] {
  return [...saved].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/** Saved institutions live in Clerk's per-user privateMetadata (readable/writable only
 * from the backend) rather than a dedicated DynamoDB table, so saves need no new infra
 * and already follow the signed-in user across devices. */
export async function getSavedInstitutions(userId: string): Promise<SavedInstitution[]> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = user.privateMetadata as SavedInstitutionsPrivateMetadata;
  return sortSavedInstitutionsByRecency(metadata.savedInstitutions ?? []);
}

export async function saveInstitutionForUser(userId: string, institutionId: string): Promise<SavedInstitution[]> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = user.privateMetadata as SavedInstitutionsPrivateMetadata;
  const savedInstitutions = withSavedInstitution(metadata.savedInstitutions ?? [], institutionId, new Date().toISOString());
  await client.users.updateUserMetadata(userId, { privateMetadata: { savedInstitutions } });
  return sortSavedInstitutionsByRecency(savedInstitutions);
}

export async function unsaveInstitutionForUser(userId: string, institutionId: string): Promise<SavedInstitution[]> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = user.privateMetadata as SavedInstitutionsPrivateMetadata;
  const savedInstitutions = withoutSavedInstitution(metadata.savedInstitutions ?? [], institutionId);
  await client.users.updateUserMetadata(userId, { privateMetadata: { savedInstitutions } });
  return sortSavedInstitutionsByRecency(savedInstitutions);
}

/** Hydrates saved institution IDs into full records for display, dropping any that no
 * longer resolve (e.g. delisted since being saved) rather than rendering a broken entry. */
export async function getSavedInstitutionRecords(userId: string): Promise<SavedInstitutionRecord[]> {
  const saved = await getSavedInstitutions(userId);
  const records = await Promise.all(
    saved.map(async ({ institutionId, savedAt }) => {
      const institution = await getInstitution(institutionId);
      return institution ? { institution, savedAt } : null;
    }),
  );
  return records.filter((record): record is SavedInstitutionRecord => record !== null);
}
