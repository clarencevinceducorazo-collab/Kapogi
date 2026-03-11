import { NextResponse } from "next/server";
import "server-only";

export const maxDuration = 120;

/**
 * GET /api/pinata/upload
 * 
 * Generates a signed upload URL for Pinata without using the SDK.
 */
export async function GET() {
  try {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      throw new Error("Missing PINATA_JWT environment variable");
    }

    const response = await fetch("https://api.pinata.cloud/v3/files/sign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        expires: 120,
        mimeTypes: ["image/*"],
        maxFileSize: 209715200, // 200MB
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API error: ${response.status} - ${errorText}`);
    }

    const { data } = await response.json();
    return NextResponse.json({ url: data });
  } catch (err: any) {
    console.error("Presign error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
