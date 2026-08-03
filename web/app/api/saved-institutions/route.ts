import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSavedInstitutions, saveInstitutionForUser, unsaveInstitutionForUser } from "@/lib/dashboardData";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const saved = await getSavedInstitutions(userId);
  return NextResponse.json({ saved });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { institutionId } = await request.json();
  if (!institutionId) return NextResponse.json({ error: "institutionId required" }, { status: 400 });

  const saved = await saveInstitutionForUser(userId, institutionId);
  return NextResponse.json({ saved });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { institutionId } = await request.json();
  if (!institutionId) return NextResponse.json({ error: "institutionId required" }, { status: 400 });

  const saved = await unsaveInstitutionForUser(userId, institutionId);
  return NextResponse.json({ saved });
}
