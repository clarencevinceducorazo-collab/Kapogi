'use client';

/**
 * Frontend API library for the Identity Binding Flow.
 */

// Calls the backend to get a unique, single-use message to be signed.
export async function getNonceToSign(
  walletAddress: string,
  xUsername: string
): Promise<string> {
  const response = await fetch('/api/identity/get-nonce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, xUsername }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to get signing message.');
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
  const response = await fetch('/api/identity/verify-binding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 409 && data.error === 'already_bound') return data;
    throw new Error(data.error || 'Binding verification failed.');
  }
  return data;
}

/**
 * Checks if a wallet address is already bound to an X account.
 * Uses a timestamp parameter to avoid browser caching of stale data.
 */
export async function checkBinding(walletAddress: string): Promise<{ bound: boolean; x_username?: string; x_uid?: string }> {
  if (!walletAddress) return { bound: false };
  const response = await fetch(`/api/identity/check-binding?address=${walletAddress.toLowerCase()}&t=${Date.now()}`);
  if (!response.ok) return { bound: false };
  return response.json();
}

/**
 * Checks if an X account is already bound to a wallet address.
 */
export async function checkBindingByXUid(x_uid: string): Promise<{ bound: boolean; sui_address?: string; x_username?: string }> {
  if (!x_uid) return { bound: false };
  const response = await fetch(`/api/identity/check-binding-x?x_uid=${x_uid}&t=${Date.now()}`);
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
