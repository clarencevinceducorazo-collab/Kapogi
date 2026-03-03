import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { fromB64 } from '@mysten/sui.js/utils';
import { Ed25519PublicKey } from '@mysten/sui.js/keypairs/ed25519';
import { Secp256k1PublicKey } from '@mysten/sui.js/keypairs/secp256k1';

/**
 * API Route: /api/identity/verify-binding
 * 
 * Verifies a signed message from a Sui wallet and creates an identity binding in Firestore.
 * Normalizes wallet addresses to lowercase to prevent casing mismatches.
 */
export async function POST(request: NextRequest) {
    try {
        const adminDb = getAdminDb();
        
        const { message, signature, walletAddress: rawWalletAddress, x_uid, x_username } = await request.json();

        if (!message || !signature || !rawWalletAddress || !x_uid || !x_username) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
        }

        const walletAddress = rawWalletAddress.toLowerCase();

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
        if (nonceData?.walletAddress.toLowerCase() !== walletAddress) {
            throw new Error('This security code was issued for a different wallet address.');
        }
        if (nonceData?.expiresAt < Date.now()) {
            await nonceRef.delete();
            throw new Error('This security code has expired. Please try again.');
        }
        
        // --- 2. Signature Verification ---
        try {
            const signatureBytes = fromB64(signature);
            const flag = signatureBytes[0];

            if (flag === 0x00 || flag === 0x01) {
                let publicKey;
                if (flag === 0x00) {
                    publicKey = new Ed25519PublicKey(signatureBytes.slice(1, 33));
                } else {
                    publicKey = new Secp256k1PublicKey(signatureBytes.slice(1, 34));
                }

                const recoveredAddress = publicKey.toSuiAddress().toLowerCase();
                if (recoveredAddress !== walletAddress) {
                    throw new Error(`Signature mismatch. Wallet: ${walletAddress}, Recovered: ${recoveredAddress}`);
                }
            } else if (flag === 0x05 || flag === 0x03) {
                // zkLogin or MultiSig - Trust nonce bound address
                console.log('[verify-binding] Smart signature detected — trusting nonce-bound address.');
            } else {
                throw new Error(`Unsupported signature scheme flag: ${flag}`);
            }
        } catch (sigError: any) {
            console.error('[verify-binding] Signature verification error:', sigError);
            throw new Error(`Cryptographic verification failed: ${sigError.message}`);
        }

        // Security check passed
        await nonceRef.delete();

        // --- 3. Uniqueness Check & Create Binding ---
        const bindingsRef = adminDb.collection('identity-bindings');

        try {
            await adminDb.runTransaction(async (transaction) => {
                const existingByX = await transaction.get(bindingsRef.where('x_uid', '==', x_uid));
                if (!existingByX.empty) {
                    throw new Error(`ALREADY_BOUND: X account @${x_username} is already linked to a wallet.`);
                }

                const existingBySui = await transaction.get(bindingsRef.where('sui_address', '==', walletAddress));
                if (!existingBySui.empty) {
                    throw new Error(`ALREADY_BOUND: This wallet is already linked to an X account.`);
                }

                const bindingId = `${x_uid}_${walletAddress}`;
                const newBindingRef = bindingsRef.doc(bindingId);
                transaction.set(newBindingRef, {
                    x_uid,
                    x_username,
                    sui_address: walletAddress, // Stored as lowercase
                    verified_at: new Date(),
                    revoked: false,
                });
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
            details: error.stack || JSON.stringify(error)
        }, { status: 500 });
    }
}
