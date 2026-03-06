import { NextResponse } from "next/server";
import { listPinnedFiles } from "@/lib/server/pinata";

/**
 * GET /api/pinata/list
 * Returns a list of all pinned files from Pinata.
 */
export async function GET() {
  try {
    const files = await listPinnedFiles();
    return NextResponse.json({ files });
  } catch (err: any) {
    console.error("❌ /api/pinata/list error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
