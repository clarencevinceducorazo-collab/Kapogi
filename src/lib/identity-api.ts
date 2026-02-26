'use client';

/**
 * Frontend API library for the Identity Binding Flow.
 * 
 * These functions are called by the UI components and are responsible for
 * making `fetch` requests to your backend (the Next.js API routes).
 */
import { generateCodeVerifier, generateCodeChallenge } from './crypto';

// This function opens the X OAuth2 authorization URL in a popup.
export async function loginWithX(): Promise<void> {
  console.log('API: Initiating X OAuth 2.0 PKCE flow...');

  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store the verifier and state to be checked in the callback
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  sessionStorage.setItem('pkce_state', state);

  const xClientId = process.env.NEXT_PUBLIC_X_CLIENT_ID;
  if (!xClientId || xClientId === "YOUR_X_APP_CLIENT_ID_HERE") {
    throw new Error('X Client ID is not configured. Please set NEXT_PUBLIC_X_CLIENT_ID in your .env file.');
  }

  const redirectUri = `${window.location.origin}/auth/x/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: xClientId,
    redirect_uri: redirectUri,
    scope: 'users.read tweet.read',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  
  const popupWidth = 600;
  const popupHeight = 700;
  const left = window.screen.width / 2 - popupWidth / 2;
  const top = window.screen.height / 2 - popupHeight / 2;

  window.open(authUrl, 'x-login', `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`);
}


// Calls the backend to exchange the authorization code for user details.
export async function exchangeCodeForXUser(code: string, codeVerifier: string): Promise<{
  id: string;
  name: string;
  username: string;
}> {
  console.log('API Client: Calling backend to exchange code...');
  
  const redirectUri = `${window.location.origin}/auth/x/callback`;

  const response = await fetch('/api/identity/exchange-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, codeVerifier, redirectUri }),
  });

  const data = await response.json();

  if (!response.ok) {
      let errorMessage = data.error || 'Failed to exchange authorization code.';
      if (data.details) {
        errorMessage = `${errorMessage}\n\nServer Response:\n${JSON.stringify(data.details, null, 2)}`;
      }
      throw new Error(errorMessage);
  }

  return data;
}


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

  return data;
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
