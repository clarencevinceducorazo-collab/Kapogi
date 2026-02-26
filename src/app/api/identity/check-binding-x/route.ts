
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

/**
 * API Route: /api/identity/check-binding-x
 * 
 * Checks if an X UID is already linked to a Sui wallet in Firestore.
 */
export async function GET(request: NextRequest) {
  try {
    const x_uid = request.nextUrl.searchParams.get('x_uid')
    if (!x_uid) return NextResponse.json({ bound: false })

    const adminDb = getAdminDb()
    
    // Query Firestore for a binding with this X UID
    const snapshot = await adminDb.collection('identity-bindings')
      .where('x_uid', '==', x_uid)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return NextResponse.json({ bound: false })
    }

    const data = snapshot.docs[0].data()
    return NextResponse.json({
      bound: true,
      sui_address: data.sui_address,
      x_username: data.x_username,
    })
  } catch (error: any) {
    console.error('[API /check-binding-x] Error:', error)
    return NextResponse.json({ bound: false, error: 'Failed to check binding status' }, { status: 500 })
  }
}
