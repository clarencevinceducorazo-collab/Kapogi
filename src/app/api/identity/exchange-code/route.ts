
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

    const clientId = process.env.NEXT_PUBLIC_X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;

    if (!clientId) {
      throw new Error("Server configuration error: NEXT_PUBLIC_X_CLIENT_ID is not set in .env file.");
    }
    if (!clientSecret) {
        throw new Error("Server configuration error: X_CLIENT_SECRET is not set in .env file.");
    }
    
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
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: tokenParams.toString(),
    });

    const tokenResponseText = await tokenResponse.text();

    if (!tokenResponse.ok) {
        console.error('[API /exchange-code] ERROR: Token exchange request failed with status:', tokenResponse.status);
        try {
            const errorDetails = JSON.parse(tokenResponseText);
             return NextResponse.json({ 
                error: 'Token exchange with X failed.',
                details: errorDetails
            }, { status: 500 });
        } catch (e) {
             return NextResponse.json({ 
                error: 'Token exchange with X failed. Raw response attached.',
                details: tokenResponseText
            }, { status: 500 });
        }
    }
    
    const tokenResponseData = JSON.parse(tokenResponseText);
    const accessToken = tokenResponseData.access_token;
    
    if (!accessToken) {
        throw new Error(`X API Error: Access Token was not provided. Response: ${tokenResponseText}`);
    }

    // --- Step 2: Use the access token to fetch the user's profile ---
    const userUrl = 'https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url';
    
    const userResponse = await fetch(userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userResponseText = await userResponse.text();

    if (!userResponse.ok) {
      console.error('[API /exchange-code] ERROR during user fetch:', userResponseText);
      try {
            const errorDetails = JSON.parse(userResponseText);
             return NextResponse.json({ 
                error: 'Failed to fetch user profile from X.',
                details: errorDetails
            }, { status: 500 });
        } catch (e) {
             return NextResponse.json({ 
                error: 'Failed to fetch user profile from X. Raw response attached.',
                details: userResponseText
            }, { status: 500 });
        }
    }

    const userJson = JSON.parse(userResponseText);
    const { data: user } = userJson;
    
    if (!user) {
        throw new Error('User data object was not found in the response from X.');
    }
    
    return NextResponse.json({
        id: user.id,
        name: user.name,
        username: user.username,
    });

  } catch (error: any) {
    const errorMessage = (error instanceof Error) ? error.message : "An unknown server error occurred.";
    console.error('[API /exchange-code] FINAL CATCH BLOCK - An unexpected error occurred:', errorMessage);
    
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}
