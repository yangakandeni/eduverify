import { NextResponse } from "next/server";
import { ALL_INSTITUTIONS } from "@/lib/localData";

/** Powers the discovery homepage (hero, category pills, browse grid). Local-seed only —
 * this listing doesn't need DynamoDB's live register data to be useful for browsing. */
export async function GET() {
  return NextResponse.json({ institutions: ALL_INSTITUTIONS });
}
