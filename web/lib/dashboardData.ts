export interface SavedInstitution {
  institutionId: string;
  savedAt: string;
}

export interface RecentlyViewedInstitution {
  institutionId: string;
  viewedAt: string;
}

/** No per-user data table exists yet; these return empty until save/view-tracking write to DynamoDB. */
export async function getSavedInstitutions(_userId: string): Promise<SavedInstitution[]> {
  return [];
}

export async function getRecentlyViewedInstitutions(_userId: string): Promise<RecentlyViewedInstitution[]> {
  return [];
}
