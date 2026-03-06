/**
 * POST /api/pinata/upload
 *
 * Accepts a multipart/form-data request with:
 *   file  — the image Blob/File to pin
 *   name  — character name (used as filename)
 *
 * Returns { imageUrl, imageHash } on success.
 *
 * ✅ Secrets (PINATA_JWT / API keys) stay 100% server-side here.
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadCharacterToIPFS } from "@/lib/server/pinata";

export const maxDuration = 120; // 2 minutes for heavy asset processing

export async function POST(req: NextRequest) {
  try {
    // 1. Proactive size check from headers
    const contentLength = parseInt(req.headers.get("content-length") || "0");
    if (contentLength > 200 * 1024 * 1024) { // 200MB limit
      return NextResponse.json({ error: "File too large. Max 200MB." }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string | null) ?? "shop-asset";

    if (!file) {
      console.error("❌ /api/pinata/upload: No file provided in form data");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`[API] Received shop asset: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // 2. Upload to IPFS
    const { imageUrl, imageHash } = await uploadCharacterToIPFS(file, { name });

    return NextResponse.json({ imageUrl, imageHash });
  } catch (err: any) {
    console.error("❌ /api/pinata/upload error:", err.message || err);
    
    if (err.message?.includes("fetch failed") || err.message?.includes("terminated")) {
      return NextResponse.json({ error: "Upload connection timed out. Please try a smaller file or faster network." }, { status: 500 });
    }

    return NextResponse.json(
      { error: err.message || "Internal server error during upload" },
      { status: 500 }
    );
  }
}
