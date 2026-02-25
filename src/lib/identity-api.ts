/**
 * MOCK API for Identity Binding Flow
 *
 * In a real application, these functions would be replaced with actual API calls
 * to your backend (e.g., Firebase Cloud Functions). The backend would handle
 * the secure logic for OAuth, nonce generation, and signature verification.
 */
import { generateCodeVerifier, generateCodeChallenge } from './crypto';

// This function now opens the X OAuth2 authorization URL in a popup.
export async function loginWithX(): Promise<void> {
  console.log('API: Initiating X OAuth 2.0 PKCE flow...');

  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store the verifier and state to be checked in the callback
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  sessionStorage.setItem('pkce_state', state);

  const xClientId = process.env.NEXT_PUBLIC_X_CLIENT_ID;
  if (!xClientId || xClientId === "YOUR_X_APP_CLIENT_ID") {
    throw new Error('X Client ID is not configured. Please set NEXT_PUBLIC_X_CLIENT_ID in your .env file.');
  }

  const redirectUri = `${window.location.origin}/auth/x/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: xClientId,
    redirect_uri: redirectUri,
    scope: 'users.read tweet.read offline.access',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  
  // Open popup
  const popupWidth = 600;
  const popupHeight = 700;
  const left = window.screen.width / 2 - popupWidth / 2;
  const top = window.screen.height / 2 - popupHeight / 2;

  window.open(authUrl, 'x-login', `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`);
}


// This new function simulates the backend exchanging the authorization code.
export async function exchangeCodeForXUser(code: string, codeVerifier: string): Promise<{
  id: string;
  name: string;
  username: string;
}> {
  console.log('API: Simulating backend code exchange...');
  console.log(`Received code: ${code}`);
  console.log(`Received verifier: ${codeVerifier}`);
  // In a real app, you would send the `code` and `codeVerifier` to your
  // backend. The backend would then make a POST request to X's token
  // endpoint to get the access token, and then use that token to fetch
  // the user's profile from the /2/users/me endpoint.

  // Here, we just simulate a successful response.
  await new Promise(resolve => setTimeout(resolve, 1500));

  // The shape of the actual response from /2/users/me is { data: { id, name, username } }
  return {
    id: '123456789', // Mocked user ID from X
    name: 'Kapogian Master', // Mocked name from X
    username: 'KapogianMaster', // Mocked username from X
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
