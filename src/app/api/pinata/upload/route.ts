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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string | null) ?? "character";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File → Blob so the server-side helper can consume it
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || "image/png" });

    const { imageUrl, imageHash } = await uploadCharacterToIPFS(blob, { name });

    return NextResponse.json({ imageUrl, imageHash });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("❌ /api/pinata/upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
