'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { exchangeCodeForXUser } from '@/lib/identity-api';
import { LoaderCircle } from 'lucide-react';

export default function XCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Authenticating with X...');
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    // This guard prevents the effect from running twice in React 18's Strict Mode.
    if (hasRun.current) return;
    hasRun.current = true;
      
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        console.error('X Auth Error:', errorParam, errorDescription);
        setError(errorDescription || (errorParam === 'access_denied' ? 'Authorization was denied by the user.' : `Authentication failed: ${errorParam}`));
        setStatus('Authentication failed.');
        return;
      }

      const storedState = sessionStorage.getItem('pkce_state');
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      if (!code || !state || !storedState || !codeVerifier) {
        setError('Invalid request. The authentication flow was interrupted or timed out.');
        setStatus('Verification failed.');
        return;
      }

      if (state !== storedState) {
        setError('Security check failed. State mismatch detected.');
        setStatus('Security check failed.');
        return;
      }

      // Cleanup session storage
      sessionStorage.removeItem('pkce_state');
      sessionStorage.removeItem('pkce_code_verifier');

      try {
        setStatus('Verifying credentials...');
        const user = await exchangeCodeForXUser(code, codeVerifier);
        
        localStorage.setItem('x-auth-user', JSON.stringify(user));
        
        setTimeout(() => {
          window.close();
        }, 100);

      } catch (err: any) {
        console.error('Exchange Code Error:', err);
        setError(err.message || 'Failed to exchange authorization code for user details.');
        setStatus('Authentication failed.');
      }
    };

    if (typeof window !== "undefined") {
      handleAuth();
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-8 text-center">
      <div className="w-full max-w-md">
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
            <div className="mt-4 text-sm bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-left">
                <p className="font-semibold">Error Details:</p>
                <p className="font-medium mt-1">{error}</p>
                <p className="mt-4 text-xs text-gray-400">You can close this window and try again.</p>
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
