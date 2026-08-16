import { NextRequest, NextResponse } from "next/server";
import { searchQualificationsGlobal } from "@/lib/qualificationsData";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  if (!query.trim()) {
    return NextResponse.json({ query, results: [] });
  }

  return NextResponse.json({ query, results: searchQualificationsGlobal(query) });
}
