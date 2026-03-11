import { NextResponse } from 'next/server';

const PINATA_JWT = process.env.PINATA_JWT!;
const BASE = 'https://api.pinata.cloud/v3';

/**
 * DELETE /api/pinata/groups/[id]
 * Permanently removes a group from Pinata.
 */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const res = await fetch(`${BASE}/groups/public/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${PINATA_JWT}` }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Pinata error: ${res.status} - ${errText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Groups DELETE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
