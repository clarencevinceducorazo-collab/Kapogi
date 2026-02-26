import { NextResponse } from 'next/server';

/**
 * This route is deprecated and has been replaced by manual username binding.
 */
export async function POST() {
  return NextResponse.json({ error: 'OAuth flow is deprecated.' }, { status: 410 });
}
