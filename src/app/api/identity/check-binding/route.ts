import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * API Route: /api/identity/check-binding
 * 
 * Checks if a Sui wallet address is already linked to an X account in Firestore.
 */
export async function GET(request: NextRequest) {
    try {
        const address = request.nextUrl.searchParams.get('address');
        if (!address) {
            return NextResponse.json({ bound: false });
        }

        const adminDb = getAdminDb();
        
        // Query Firestore for a binding with this Sui address
        const snapshot = await adminDb.collection('identity-bindings')
            .where('sui_address', '==', address)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ bound: false });
        }

        const data = snapshot.docs[0].data();
        return NextResponse.json({ 
            bound: true, 
            x_username: data.x_username,
            x_uid: data.x_uid 
        });

    } catch (error: any) {
        console.error('[API /check-binding] Error:', error);
        return NextResponse.json({ bound: false, error: 'Failed to check binding status' }, { status: 500 });
    }
}
