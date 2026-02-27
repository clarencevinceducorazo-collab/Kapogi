/**
 * POST /api/pinata/unpin
 *
 * Accepts a JSON body: { hash: string }
 *
 * Unpins (deletes) a file from Pinata by its IPFS CID/hash.
 *
 * ✅ Pinata credentials stay server-side only.
 */

import { NextRequest, NextResponse } from "next/server";
import { unpinFromIPFS } from "@/lib/server/pinata";

export async function POST(req: NextRequest) {
  try {
    const { hash } = await req.json();

    if (!hash || typeof hash !== "string") {
      return NextResponse.json(
        { error: 'Missing or invalid "hash" field' },
        { status: 400 },
      );
    }

    await unpinFromIPFS(hash);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unpin failed";
    console.error("❌ /api/pinata/unpin error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
