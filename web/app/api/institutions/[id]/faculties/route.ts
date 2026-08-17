import { NextResponse } from "next/server";
import { toServiceUnavailableResponse } from "@/lib/apiRouteError";
import { getInstitution } from "@/lib/institutions";
import { getFacultiesForInstitution } from "@/lib/qualificationsData";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const institution = await getInstitution(decodeURIComponent(id));
    if (!institution) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ faculties: getFacultiesForInstitution(institution) });
  } catch (error) {
    return toServiceUnavailableResponse(error);
  }
}
