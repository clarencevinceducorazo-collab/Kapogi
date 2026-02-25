
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: /api/identity/exchange-code
 * 
 * This is a backend route that securely exchanges an OAuth 2.0 authorization code
 * for an access token from X (Twitter), and then uses that token to fetch the user's profile.
 * 
 * Security:
 * - This logic MUST run on the server, as it uses the `X_CLIENT_SECRET`.
 * - It expects a `code` and `codeVerifier` from the client as part of the PKCE flow.
 */
export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier, redirectUri } = await request.json();

    if (!code || !codeVerifier || !redirectUri) {
      return NextResponse.json({ error: 'Missing required parameters: code, codeVerifier, or redirectUri' }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_X_CLIENT_ID!;
    const clientSecret = process.env.X_CLIENT_SECRET!;
    
    // --- Step 1: Exchange authorization code for an access token ---
    const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
    
    const tokenParams = new URLSearchParams({
      code: code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });
    
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    console.log("\n[API /exchange-code] STEP 1: Attempting to exchange code for access token...");
    console.log("[API /exchange-code] Request URL:", tokenUrl);
    console.log("[API /exchange-code] Request Body:", tokenParams.toString());

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: tokenParams,
    });

    const tokenResponseText = await tokenResponse.text();
    console.log('[API /exchange-code] Token exchange response text:', tokenResponseText);
    
    let tokenResponseData;
    try {
        tokenResponseData = JSON.parse(tokenResponseText);
    } catch (e) {
        console.error('[API /exchange-code] ERROR: Failed to parse token response as JSON.');
        throw new Error(`Invalid response from X token endpoint: ${tokenResponseText}`);
    }


    if (!tokenResponse.ok) {
        console.error('[API /exchange-code] ERROR during token exchange:');
        console.error('Status:', tokenResponse.status);
        console.error('Response Body:', JSON.stringify(tokenResponseData, null, 2));
        throw new Error(tokenResponseData.error_description || 'Failed to exchange authorization code.');
    }
    
    const accessToken = tokenResponseData.access_token;
    console.log("[API /exchange-code] SUCCESS: Received access token.");


    // --- Step 2: Use the access token to fetch the user's profile ---
    const userUrl = 'https://api.twitter.com/2/users/me?user.fields=id,name,username';
    
    console.log("\n[API /exchange-code] STEP 2: Attempting to fetch user profile...");
    console.log("[API /exchange-code] Request URL:", userUrl);

    const userResponse = await fetch(userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userResponseText = await userResponse.text();

    if (!userResponse.ok) {
      console.error('[API /exchange-code] ERROR during user fetch:');
      console.error(`Status: ${userResponse.status} - ${userResponse.statusText}`);
      console.error('Response Body:', userResponseText);
      throw new Error('Failed to fetch user profile from X.');
    }

    const userJson = JSON.parse(userResponseText);
    console.log('[API /exchange-code] SUCCESS: Received user data:', JSON.stringify(userJson, null, 2));
    const { data: user } = userJson;
    
    if (!user) {
        console.error('[API /exchange-code] ERROR: User data object not found in X API response.');
        throw new Error('User data not found in X API response.');
    }
    
    console.log('[API /exchange-code] --- Entire flow successful ---');
    // Return only the necessary user data to the frontend
    return NextResponse.json({
        id: user.id,
        name: user.name,
        username: user.username,
    });

  } catch (error: any) {
    console.error('[API /exchange-code] FINAL CATCH BLOCK - An unexpected error occurred:', error);
    return NextResponse.json({ error: error.message || 'An unexpected internal server error occurred.' }, { status: 500 });
  }
}
