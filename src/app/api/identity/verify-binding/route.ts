
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyPersonalMessage } from '@mysten/sui.js/verify';

/**
 * API Route: /api/identity/verify-binding
 * 
 * Verifies a signed message from a Sui wallet and creates an identity binding in Firestore.
 */
export async function POST(request: NextRequest) {
    try {
        const adminDb = getAdminDb();
        
        const { message, signature, walletAddress, x_uid, x_username } = await request.json();

        if (!message || !signature || !walletAddress || !x_uid || !x_username) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
        }

        // --- 1. Nonce Verification ---
        const nonceMatch = message.match(/Nonce: ([\w-]+)/);
        if (!nonceMatch || !nonceMatch[1]) {
            throw new Error('Could not find Nonce in the signed message.');
        }
        const nonce = nonceMatch[1];

        const nonceRef = adminDb.collection('nonces').doc(nonce);
        const nonceDoc = await nonceRef.get();

        if (!nonceDoc.exists) {
            throw new Error('This security code (nonce) has already been used or never existed. Please restart the process.');
        }

        const nonceData = nonceDoc.data();
        if (nonceData?.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            throw new Error('This security code was issued for a different wallet address.');
        }
        if (nonceData?.expiresAt < Date.now()) {
            await nonceRef.delete();
            throw new Error('This security code has expired. Please try again.');
        }
        
        // --- 2. Signature Verification ---
        try {
            const messageBytes = new TextEncoder().encode(message);
            const publicKey = await verifyPersonalMessage(messageBytes, signature);
            const recoveredAddress = publicKey.toSuiAddress();
            
            if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new Error(`Signature mismatch. Wallet: ${walletAddress}, Recovered: ${recoveredAddress}`);
            }
        } catch (sigError: any) {
            console.error('[verify-binding] Signature verification error:', sigError);
            throw new Error(`Cryptographic verification failed: ${sigError.message}`);
        }

        // Security check passed, delete the nonce to prevent reuse.
        await nonceRef.delete();

        // --- 3. Uniqueness Check & Create Binding ---
        const bindingsRef = adminDb.collection('identity-bindings');

        try {
            const result = await adminDb.runTransaction(async (transaction) => {
                // Check if X ID is already bound
                const existingByX = await transaction.get(bindingsRef.where('x_uid', '==', x_uid));
                if (!existingByX.empty) {
                    throw new Error(`ALREADY_BOUND: X account @${x_username} is already linked to a wallet.`);
                }

                // Check if Wallet is already bound
                const existingBySui = await transaction.get(bindingsRef.where('sui_address', '==', walletAddress));
                if (!existingBySui.empty) {
                    throw new Error(`ALREADY_BOUND: This wallet is already linked to an X account.`);
                }

                // Create the new binding
                const bindingId = `${x_uid}_${walletAddress}`;
                const newBindingRef = bindingsRef.doc(bindingId);
                transaction.set(newBindingRef, {
                    x_uid,
                    x_username,
                    sui_address: walletAddress,
                    verified_at: new Date(),
                    revoked: false,
                });
                return { success: true };
            });

            return NextResponse.json({ success: true, message: 'Identity verified and bound successfully!' });

        } catch (transError: any) {
            if (transError.message.includes('ALREADY_BOUND')) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'already_bound', 
                    message: transError.message.replace('ALREADY_BOUND: ', '') 
                }, { status: 409 });
            }
            throw transError;
        }

    } catch (error: any) {
        console.error('[API /verify-binding] Final Error:', error);
        return NextResponse.json({ 
            error: error.message || 'An internal server error occurred.',
            details: error.stack
        }, { status: 500 });
    }
}
