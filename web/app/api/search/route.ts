import { NextRequest, NextResponse } from "next/server";
import { searchInstitutions } from "@/lib/institutions";
import { searchLocal } from "@/lib/search";
import type { InstitutionType } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? "";
  const province = searchParams.get("province") ?? undefined;
  const institutionType = (searchParams.get("institutionType") as InstitutionType | null) ?? undefined;
  const mode = searchParams.get("mode");

  if (!query.trim()) {
    return NextResponse.json({ query, results: [], notFound: false });
  }

  const filters = { province, institutionType };

  // Typeahead suggestions stay local-only for instant response; DynamoDB is only
  // consulted for the full search a user triggers on submit.
  if (mode === "typeahead") {
    const results = searchLocal(query, filters, 8);
    return NextResponse.json({ query, results, notFound: results.length === 0 });
  }

  const { results, notFound } = await searchInstitutions(query, filters);
  return NextResponse.json({ query, results, notFound });
}
