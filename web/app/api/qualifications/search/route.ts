import { NextRequest, NextResponse } from "next/server";
import { toServiceUnavailableResponse } from "@/lib/apiRouteError";
import { getAllInstitutions } from "@/lib/institutions";
import { searchQualificationsGlobal } from "@/lib/qualificationsData";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  if (!query.trim()) {
    return NextResponse.json({ query, results: [] });
  }

  try {
    const institutions = await getAllInstitutions();
    return NextResponse.json({ query, results: searchQualificationsGlobal(institutions, query) });
  } catch (error) {
    return toServiceUnavailableResponse(error);
  }
}
