'use server';

/**
 * MOCK API for Identity Binding Flow
 *
 * In a real application, these functions would be replaced with actual API calls
 * to your backend (e.g., Firebase Cloud Functions). The backend would handle
 * the secure logic for OAuth, nonce generation, and signature verification.
 */

// This would initiate the Twitter OAuth flow on your backend and return the user.
export async function loginWithX(): Promise<{
  id: string;
  name: string;
  username: string;
}> {
  console.log('API: Simulating X Login...');
  // In a real app, you would redirect to your backend's /auth/x/login endpoint.
  // The backend would handle the OAuth dance and redirect back with a session.
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    id: '123456789',
    name: 'Kapogian Master',
    username: 'KapogianMaster',
  };
}

// This would call your backend to get a unique, single-use message to be signed.
export async function getNonceToSign(
  walletAddress: string,
  xUsername: string
): Promise<string> {
  console.log('API: Fetching nonce for signing...');
  // The backend should generate a unique nonce (e.g., a UUID), store it
  // with an expiry, and construct the message. This prevents replay attacks.
  await new Promise(resolve => setTimeout(resolve, 500));
  const nonce = crypto.randomUUID();
  const timestamp = Date.now();
  const message = `Bind X account @${xUsername} to Sui wallet ${walletAddress}.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
  return message;
}

interface VerificationPayload {
  message: string;
  signature: string;
  walletAddress: string;
  x_uid: string;
  x_username: string;
}

// This sends the signature and original message to the backend for verification.
export async function verifyBinding(payload: VerificationPayload): Promise<{ success: boolean; message: string }> {
  console.log('API: Verifying binding on backend...', payload);
  // The backend MUST:
  // 1. Reconstruct the exact message that was sent to the client.
  // 2. Look up the nonce in the database to ensure it's valid and not used.
  // 3. Use the Sui SDK to verify the signature against the message and wallet address.
  // 4. If valid, invalidate the nonce.
  // 5. Create the binding in Firestore.
  // 6. Return success.
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('API: Verification successful (simulated).');
  return { success: true, message: 'Your identity has been verified!' };
}
