import { NextRequest, NextResponse } from "next/server";
import { getInstitution } from "@/lib/institutions";
import { getQualificationsForInstitutionFaculty } from "@/lib/qualificationsData";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const institution = await getInstitution(decodeURIComponent(id));

  if (!institution) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const faculty = request.nextUrl.searchParams.get("faculty") ?? undefined;
  return NextResponse.json({
    qualifications: getQualificationsForInstitutionFaculty(institution, faculty),
  });
}
