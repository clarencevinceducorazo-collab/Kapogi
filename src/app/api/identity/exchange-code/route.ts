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
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.json();
        console.error('X Token Exchange Error:', errorBody);
        throw new Error(errorBody.error_description || 'Failed to exchange authorization code.');
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // --- Step 2: Use the access token to fetch the user's profile ---
    const userUrl = 'https://api.twitter.com/2/users/me?user.fields=id,name,username';
    const userResponse = await fetch(userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error(`X User Fetch Error: Status ${userResponse.status} - ${userResponse.statusText}`);
      console.error('Response Body:', errorText);
      // Try to parse as JSON for more detailed error info, but don't fail if it's not JSON
      try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed Error JSON:', errorJson);
      } catch (e) {
          console.error('Could not parse error response as JSON.');
      }
      throw new Error('Failed to fetch user profile from X.');
    }

    const userJson = await userResponse.json();
    console.log('X User Fetch Success Response:', userJson);
    const { data: user } = userJson;
    
    if (!user) {
        console.error('User data object not found in X API response:', userJson);
        throw new Error('User data not found in X API response.');
    }
    
    // Return only the necessary user data to the frontend
    return NextResponse.json({
        id: user.id,
        name: user.name,
        username: user.username,
    });

  } catch (error: any) {
    console.error('[API /exchange-code] Error:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
