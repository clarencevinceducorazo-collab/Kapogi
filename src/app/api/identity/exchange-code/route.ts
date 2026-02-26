
import { NextResponse } from 'next/server';

/**
 * This route is deprecated and replaced by NextAuth internally.
 */
export async function POST() {
  return NextResponse.json({ error: 'OAuth flow is handled by NextAuth.' }, { status: 410 });
}
