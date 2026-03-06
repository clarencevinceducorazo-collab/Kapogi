
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

export const maxDuration = 60; // Increase timeout for large GIF uploads

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string | null) ?? "character";

    if (!file) {
      console.error("❌ /api/pinata/upload: No file provided in form data");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Increased limit to 50MB
    if (file.size > 50 * 1024 * 1024) {
      console.warn(`⚠️ /api/pinata/upload: File too large (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return NextResponse.json({ error: "File too large. Max 50MB." }, { status: 413 });
    }

    // Convert File → Blob so the server-side helper can consume it
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || "image/png" });

    const { imageUrl, imageHash } = await uploadCharacterToIPFS(blob, { name });

    return NextResponse.json({ imageUrl, imageHash });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("❌ /api/pinata/upload error:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
