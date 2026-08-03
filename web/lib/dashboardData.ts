export interface SavedInstitution {
  institutionId: string;
  savedAt: string;
}

/** No per-user data table exists yet; this returns empty until save-tracking writes to DynamoDB. */
export async function getSavedInstitutions(_userId: string): Promise<SavedInstitution[]> {
  return [];
}
