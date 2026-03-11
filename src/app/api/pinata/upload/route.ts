import { NextResponse } from "next/server";
import "server-only";

/**
 * GET /api/pinata/upload
 * 
 * Generates a signed upload URL from Pinata using standard fetch.
 * This avoids "Module not found" errors associated with the Pinata SDK.
 */
export async function GET() {
  const jwt = process.env.PINATA_JWT;

  if (!jwt) {
    return NextResponse.json({ error: "Pinata JWT not configured" }, { status: 500 });
  }

  try {
    // Generate a signed upload URL using Pinata v3 API directly via fetch
    const response = await fetch("https://uploads.pinata.cloud/v3/files/upload-url", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${jwt}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        expires: 120, // Link valid for 2 minutes
        max_file_size: 209715200 // 200MB limit
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API error: ${response.status} - ${errorText}`);
    }

    const { data } = await response.json();
    return NextResponse.json({ url: data.upload_url });
  } catch (err: any) {
    console.error("❌ Presign error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
