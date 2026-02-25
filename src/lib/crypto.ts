/**
 * @fileoverview Cryptographic utilities for PKCE flow.
 * These functions run on the client-side.
 */

/**
 * Generates a high-entropy random string for the PKCE code verifier.
 * This is a secret that the client holds.
 * @returns A base64url-encoded random string.
 */
export function generateCodeVerifier(): string {
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  // Base64URL encode the byte array
  let base64 = window.btoa(String.fromCharCode(...randomBytes));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Creates a SHA-256 hash of the code verifier and base64url encodes it.
 * This is the public challenge sent to the authorization server.
 * @param verifier The code verifier string.
 * @returns The base64url-encoded SHA-256 hash.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  // Base64URL encode the ArrayBuffer
  const base64 = window.btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
