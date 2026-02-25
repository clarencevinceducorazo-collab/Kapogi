'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { exchangeCodeForXUser } from '@/lib/identity-api';
import { LoaderCircle } from 'lucide-react';

export default function XCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Authenticating with X...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(errorParam === 'access_denied' ? 'Authorization was denied.' : 'An unknown error occurred.');
        setStatus('Authentication failed.');
        return;
      }

      const storedState = sessionStorage.getItem('pkce_state');
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      if (!code || !state || !storedState || !codeVerifier) {
        setError('Invalid request. Missing parameters for verification.');
        setStatus('Verification failed.');
        return;
      }

      if (state !== storedState) {
        setError('Invalid state parameter. Possible CSRF attack detected.');
        setStatus('Security check failed.');
        return;
      }

      // Cleanup session storage
      sessionStorage.removeItem('pkce_state');
      sessionStorage.removeItem('pkce_code_verifier');

      try {
        setStatus('Verifying credentials...');
        const user = await exchangeCodeForXUser(code, codeVerifier);
        
        // Send the user data back to the main window via localStorage
        // This is more reliable than window.opener.postMessage
        localStorage.setItem('x-auth-user', JSON.stringify(user));
        
        // Add a small delay before closing to ensure localStorage has time to fire its event
        setTimeout(() => {
          window.close();
        }, 100);

      } catch (err: any) {
        setError(err.message || 'Failed to exchange authorization code for user details.');
        setStatus('Authentication failed.');
      }
    };

    // Ensure this runs only once on the client
    if (typeof window !== "undefined") {
      handleAuth();
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-8 text-center">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
            {error ? (
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center border-4 border-red-200">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            ) : (
                 <LoaderCircle className="w-12 h-12 animate-spin text-blue-500" />
            )}
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{status}</h1>
        {error ? (
            <div className="mt-4 text-sm bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                <p className="font-semibold">Error Details:</p>
                <p>{error}</p>
            </div>
        ) : (
            <p className="mt-2 text-gray-500">
                Please wait, you will be redirected shortly. This window will close automatically.
            </p>
        )}
      </div>
    </div>
  );
}
