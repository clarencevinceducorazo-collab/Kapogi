import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * API Route: /api/identity/unbind
 * 
 * Removes the link between an X account and a Sui wallet.
 * Security: For a production app, you should require a signature to unbind.
 * For this prototype, we trust the caller if the wallet is connected.
 */
export async function POST(request: NextRequest) {
    try {
        const { walletAddress } = await request.json();
        if (!walletAddress) {
            return NextResponse.json({ success: false, error: 'Missing walletAddress' }, { status: 400 });
        }

        const adminDb = getAdminDb();
        
        // Find all bindings for this wallet
        const snapshot = await adminDb.collection('identity-bindings')
            .where('sui_address', '==', walletAddress)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ success: true, message: 'No binding found.' });
        }

        // Delete all matching documents
        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        console.log(`[unbind] Successfully unlinked wallet: ${walletAddress}`);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[API /unbind] Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to unlink account' }, { status: 500 });
    }
}
