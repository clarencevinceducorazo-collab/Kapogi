/**
 * /api/pinata/upload
 *
 * GET  -> returns a signed upload URL from Pinata
 * POST -> uploads file to IPFS using server helper
 */

import { NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";
import { uploadCharacterToIPFS } from "@/lib/server/pinata";
import "server-only";

export const maxDuration = 120; // allow long uploads

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL!,
});

/**
 * GET
 * Creates a signed upload URL from Pinata
 */
export async function GET() {
  try {
    const url = await pinata.upload.public.createSignedURL({
      expires: 120,
      mimeTypes: ["image/*"],
      maxFileSize: 209715200, // 200MB
    });

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("❌ Presign error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST
 * Accepts multipart form upload and uploads to IPFS
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Proactive size check
    const contentLength = parseInt(req.headers.get("content-length") || "0");
    if (contentLength > 200 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 200MB." },
        { status: 413 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string | null) ?? "shop-asset";

    if (!file) {
      console.error("❌ /api/pinata/upload: No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(
      `[API] Received shop asset: ${file.name}, size: ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB`
    );

    // 2. Upload to IPFS
    const { imageUrl, imageHash } = await uploadCharacterToIPFS(file, { name });

    return NextResponse.json({ imageUrl, imageHash });
  } catch (err: any) {
    console.error("❌ /api/pinata/upload error:", err.message || err);

    if (
      err.message?.includes("fetch failed") ||
      err.message?.includes("terminated")
    ) {
      return NextResponse.json(
        {
          error:
            "Upload connection timed out. Please try a smaller file or faster network.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Internal server error during upload" },
      { status: 500 }
    );
  }
}