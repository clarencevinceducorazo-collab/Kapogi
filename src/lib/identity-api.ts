'use client';

/**
 * Frontend API library for the Identity Binding Flow.
 */

// Calls the backend to get a unique, single-use message to be signed.
export async function getNonceToSign(
  walletAddress: string,
  xUsername: string
): Promise<string> {
  console.log('API Client: Fetching nonce from backend...');
  
  const response = await fetch('/api/identity/get-nonce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, xUsername }),
  });

  const data = await response.json();

  if (!response.ok) {
    let detailedError = data.error || 'Failed to get signing message.';
    if (data.details) {
        detailedError += ` (Details: ${data.details})`;
    }
    if (data.code) {
        detailedError += ` (Code: ${data.code})`;
    }
    throw new Error(detailedError);
  }

  return data.message;
}

interface VerificationPayload {
  message: string;
  signature: string;
  walletAddress: string;
  x_uid: string;
  x_username: string;
}

// Sends the signature and original message to the backend for verification.
export async function verifyBinding(payload: VerificationPayload): Promise<{ success: boolean; message: string; error?: string }> {
  console.log('API Client: Sending signature to backend for verification...');

  const response = await fetch('/api/identity/verify-binding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 409 && data.error === 'already_bound') {
        return data;
    }
    
    let detailedError = data.error || 'Binding verification failed.';
    if (data.details) {
        detailedError += ` (Details: ${JSON.stringify(data.details, null, 2)})`;
    }
    if (data.code) {
        detailedError += ` (Code: ${data.code})`;
    }
    throw new Error(detailedError);
  }

  return data.success ? data : { success: true, message: 'Verified' };
}

/**
 * Checks if a wallet address is already bound to an X account.
 */
export async function checkBinding(walletAddress: string): Promise<{ bound: boolean; x_username?: string; x_uid?: string }> {
  const response = await fetch(`/api/identity/check-binding?address=${walletAddress}`);
  if (!response.ok) return { bound: false };
  return response.json();
}

/**
 * Removes the binding for a wallet address.
 */
export async function unbind(walletAddress: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/identity/unbind', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });
  if (!response.ok) return { success: false };
  return response.json();
}
