/**
 * GET /api/pinata/image-url?cid=<ipfs-cid>
 *
 * Server-side IPFS image proxy.
 *
 * The Pinata gateway token (PINATA_GATEWAY_KEY) lives exclusively in the
 * server environment — it is never sent to the browser.  The client calls
 * this endpoint with a raw IPFS CID; the server fetches the file from the
 * private Pinata gateway (appending the token) and streams it back.
 *
 * Using a proxy means:
 *  • Token never appears in client JS bundles.
 *  • Token never appears in browser network tab.
 *  • Browser cache still works (Cache-Control header is forwarded).
 */

import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || "https://nft.kapogian.xyz";
const GATEWAY_KEY = process.env.PINATA_GATEWAY_KEY || "";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cid = searchParams.get("cid");

  if (!cid || !/^[a-zA-Z0-9]+$/.test(cid)) {
    return NextResponse.json(
      { error: "Invalid or missing cid" },
      { status: 400 },
    );
  }

  // Build the upstream URL — token is appended server-side only.
  const upstream = GATEWAY_KEY
    ? `${GATEWAY_URL}/ipfs/${cid}?pinataGatewayToken=${GATEWAY_KEY}`
    : `${GATEWAY_URL}/ipfs/${cid}`;

  try {
    const response = await fetch(upstream, {
      // Forward the browser's conditional-request headers when present so
      // the gateway can honour 304 Not Modified responses.
      headers: {
        ...(req.headers.get("if-none-match") && {
          "If-None-Match": req.headers.get("if-none-match")!,
        }),
        ...(req.headers.get("if-modified-since") && {
          "If-Modified-Since": req.headers.get("if-modified-since")!,
        }),
      },
    });

    if (!response.ok && response.status !== 304) {
      return NextResponse.json(
        { error: `Gateway returned ${response.status}` },
        { status: response.status },
      );
    }

    // Stream the body back, forwarding useful headers.
    const headers = new Headers();
    const forward = [
      "content-type",
      "content-length",
      "cache-control",
      "etag",
      "last-modified",
    ];
    for (const h of forward) {
      const val = response.headers.get(h);
      if (val) headers.set(h, val);
    }
    // Allow browsers to cache the image for 24 h.
    if (!headers.get("cache-control")) {
      headers.set(
        "cache-control",
        "public, max-age=86400, stale-while-revalidate=3600",
      );
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (err) {
    console.error("[image-url proxy] fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch from gateway" },
      { status: 502 },
    );
  }
}
