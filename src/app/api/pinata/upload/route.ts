/**
 * /api/pinata/upload
 *
 * POST -> uploads file to IPFS via Pinata pinFileToIPFS API (server-side)
 * GET  -> returns a signed upload URL from Pinata (browser-direct upload)
 */

import { NextRequest, NextResponse } from "next/server";
import "server-only";

export const maxDuration = 120;

const getPinataHeaders = (): Record<string, string> => {
  const jwt       = process.env.PINATA_JWT;
  const apiKey    = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;

  if (jwt)                        return { Authorization: `Bearer ${jwt}` };
  if (apiKey && apiSecret)        return { pinata_api_key: apiKey, pinata_secret_api_key: apiSecret };
  throw new Error("No Pinata credentials found. Set PINATA_JWT in .env.local");
};

const getGatewayUrl = (hash: string): string => {
  const base = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || "https://nft.kapogian.xyz";
  const key  = process.env.PINATA_GATEWAY_KEY;
  return key ? `${base}/ipfs/${hash}?pinataGatewayToken=${key}` : `${base}/ipfs/${hash}`;
};

/** GET — signed URL for browser-direct upload */
export async function GET() {
  try {
    const headers = getPinataHeaders();
    const res = await fetch("https://api.pinata.cloud/v3/files/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ capabilities: ["upload"], expires: 120 }),
    });
    if (!res.ok) throw new Error(`Pinata sign error: ${res.status} ${await res.text()}`);
    const { data: url } = await res.json();
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("[upload GET]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** POST — server-side multipart upload to Pinata */
export async function POST(req: NextRequest) {
  try {
    // Size guard
    const cl = parseInt(req.headers.get("content-length") || "0");
    if (cl > 200 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 200 MB." }, { status: 413 });
    }

    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const name     = (formData.get("name") as string | null) ?? "upload";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`[upload] ${file.name} — ${(file.size / 1024).toFixed(1)} KB`);

    // Convert File → ArrayBuffer → Buffer → Blob for reliable Node.js FormData usage
    const arrayBuffer = await file.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);

    // Build multipart form for Pinata
    const pinataForm = new FormData();
    const blob       = new Blob([buffer], { type: file.type || "application/octet-stream" });
    pinataForm.append("file", blob, name || file.name);
    pinataForm.append("pinataMetadata", JSON.stringify({ name: name || file.name }));
    pinataForm.append("pinataOptions",  JSON.stringify({ cidVersion: 1 }));

    const headers = getPinataHeaders();

    // Use a manual timeout via Promise.race instead of AbortSignal.timeout
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 115_000);

    let pinataRes: Response;
    try {
      pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method:  "POST",
        headers,
        body:    pinataForm,
        signal:  controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!pinataRes.ok) {
      const errText = await pinataRes.text();
      console.error("[upload] Pinata error:", pinataRes.status, errText);
      throw new Error(`Pinata error ${pinataRes.status}: ${errText.slice(0, 200)}`);
    }

    const data      = await pinataRes.json();
    const imageHash = data.IpfsHash as string;
    if (!imageHash) throw new Error("Pinata returned no hash");

    const imageUrl = getGatewayUrl(imageHash);

    console.log("[upload] ✓", imageHash);
    return NextResponse.json({ imageUrl, imageHash });

  } catch (err: any) {
    console.error("[upload POST]", err.message);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: err.name === "AbortError" ? 504 : 500 },
    );
  }
}