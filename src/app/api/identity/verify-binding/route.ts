
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyPersonalMessage } from '@mysten/sui.js/verify';
import { Ed25519PublicKey } from '@mysten/sui.js/keypairs/ed25519';

/**
 * API Route: /api/identity/verify-binding
 * 
 * Verifies a signed message from a Sui wallet and creates an identity binding in Firestore.
 * 
 * Security:
 * 1.  Nonce Verification: Checks Firestore for a valid, unexpired nonce from the message.
 *     Deletes the nonce after use to prevent replay attacks.
 * 2.  Signature Verification: Uses Sui's cryptographic functions to ensure the signature
 *     was created by the claimed wallet address.
 * 3.  Uniqueness Check: Queries Firestore to ensure neither the X account nor the Sui wallet
 *     is already part of another binding, enforcing a 1-to-1 relationship.
 */
export async function POST(request: NextRequest) {
    try {
        const adminDb = getAdminDb(); // Initialize DB connection here
        
        const { message, signature, walletAddress, x_uid, x_username } = await request.json();

        // --- 1. Nonce Verification ---
        const nonceMatch = message.match(/Nonce: ([\w-]+)/);
        if (!nonceMatch || !nonceMatch[1]) {
            throw new Error('Invalid message format: Nonce not found.');
        }
        const nonce = nonceMatch[1];

        const nonceRef = adminDb.collection('nonces').doc(nonce);
        const nonceDoc = await nonceRef.get();

        if (!nonceDoc.exists) {
            throw new Error('Invalid or expired nonce. Please try again.');
        }

        const nonceData = nonceDoc.data();
        if (nonceData?.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            throw new Error('Nonce was not issued for this wallet address.');
        }
        if (nonceData?.expiresAt < Date.now()) {
            await nonceRef.delete(); // Clean up expired nonce
            throw new Error('Nonce has expired. Please try again.');
        }
        
        // --- 2. Signature Verification ---
        const messageBytes = new TextEncoder().encode(message);
        const publicKey = await verifyPersonalMessage(messageBytes, signature);
        const recoveredAddress = publicKey.toSuiAddress();
        
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            throw new Error('Signature verification failed. The signature does not match the wallet address.');
        }

        // Security check passed, now delete the nonce to prevent reuse.
        await nonceRef.delete();

        // --- 3. Uniqueness Check & Create Binding ---
        const bindingsRef = adminDb.collection('identity-bindings');

        // Firestore transaction to ensure atomic read/write
        const result = await adminDb.runTransaction(async (transaction) => {
            const existingByX = await transaction.get(bindingsRef.where('x_uid', '==', x_uid));
            if (!existingByX.empty) {
                throw new Error(`X account @${xUsername} is already bound to another wallet.`);
            }

            const existingBySui = await transaction.get(bindingsRef.where('sui_address', '==', walletAddress));
            if (!existingBySui.empty) {
                throw new Error('This Sui wallet is already bound to another X account.');
            }

            // All checks passed, create the new binding
            const newBindingRef = bindingsRef.doc(`${x_uid}_${walletAddress}`);
            transaction.set(newBindingRef, {
                x_uid,
                x_username,
                sui_address: walletAddress,
                verified_at: new Date(),
                revoked: false,
            });
            return { success: true };
        });


        return NextResponse.json({ success: result.success, message: 'Identity verified and bound successfully!' });

    } catch (error: any) {
        console.error('[API /verify-binding] Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}
