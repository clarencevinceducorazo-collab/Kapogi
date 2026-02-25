
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * API Route: /api/identity/get-nonce
 * 
 * Generates a secure, single-use nonce for a wallet signature request.
 * 
 * Security:
 * - Creates a unique nonce (UUID).
 * - Stores the nonce in Firestore with the wallet address and a timestamp.
 * - This prevents replay attacks, as the nonce can only be used once.
 */
export async function POST(request: NextRequest) {
    try {
        const { walletAddress, xUsername } = await request.json();

        if (!walletAddress || !xUsername) {
            return NextResponse.json({ error: 'Missing walletAddress or xUsername' }, { status: 400 });
        }

        const nonce = crypto.randomUUID();
        const timestamp = Date.now();
        const expires = timestamp + (5 * 60 * 1000); // Nonce expires in 5 minutes

        // Store nonce in Firestore
        await adminDb.collection('nonces').doc(nonce).set({
            walletAddress,
            createdAt: timestamp,
            expiresAt: expires,
        });

        const message = `Bind X account @${xUsername} to Sui wallet ${walletAddress}.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
        
        return NextResponse.json({ message });

    } catch (error: any) {
        // Log the full error for server-side debugging
        console.error('[API /get-nonce] Full error:', error);

        // Return a detailed error response to the client
        return NextResponse.json({ 
            error: error.message || 'Failed to generate nonce.',
            code: error.code,
            details: error.details,
        }, { status: 500 });
    }
}
