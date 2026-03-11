import { NextResponse } from 'next/server';

const PINATA_JWT = process.env.PINATA_JWT!;
const BASE = 'https://api.pinata.cloud/v3';

/**
 * GET /api/pinata/groups
 * Fetches all public groups from Pinata V3 API.
 */
export async function GET() {
  try {
    const res = await fetch(`${BASE}/groups/public`, {
      headers: { Authorization: `Bearer ${PINATA_JWT}` }
    });
    
    if (!res.ok) {
      throw new Error(`Pinata error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Groups GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/pinata/groups
 * Creates a new group on Pinata.
 * Body: { name: string }
 */
export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const res = await fetch(`${BASE}/groups/public`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Pinata error: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Groups POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
