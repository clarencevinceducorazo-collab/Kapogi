/**
 * /api/pinata/upload
 * 
 * GET  -> returns a signed upload URL from Pinata (Browser-direct upload)
 *         Now supports ?group_id=... to upload directly into a Pinata Group.
 * POST -> uploads file to IPFS using server-side fetch (Fallback)
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadCharacterToIPFS } from "@/lib/server/pinata";
import "server-only";

export const maxDuration = 120; // allow long uploads

/**
 * GET
 * Creates a signed upload URL from Pinata via direct API call.
 * This avoids the need for the 'pinata' SDK module resolution at build time.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const group_id = searchParams.get("group_id");

    const jwt = process.env.PINATA_JWT;
    if (!jwt) throw new Error("PINATA_JWT is not configured on server.");

    // Prepare signing body for Pinata V3
    const signBody: any = {
      capabilities: ["upload"],
      expires: 120, // 2 minutes
    };

    // If group_id is provided, bind the upload to that group
    if (group_id && group_id !== "none") {
      signBody.group_id = group_id;
      // We also add the group ID to metadata for easier client-side filtering in the list view
      signBody.metadata = {
        keyvalues: {
          group: group_id
        }
      };
    }

    const res = await fetch("https://api.pinata.cloud/v3/files/sign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(signBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Pinata sign error:", errorText);
      throw new Error(`Failed to create signed URL: ${res.status}`);
    }

    const { data: url } = await res.json();
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("❌ Presign error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST
 * Accepts multipart form upload and uploads to IPFS via standard fetch.
 */
export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    console.log(`[API] Received asset: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    const { imageUrl, imageHash } = await uploadCharacterToIPFS(file, { name });
    return NextResponse.json({ imageUrl, imageHash });
  } catch (err: any) {
    console.error("❌ /api/pinata/upload error:", err.message || err);
    return NextResponse.json(
      { error: err.message || "Internal server error during upload" },
      { status: 500 }
    );
  }
}
