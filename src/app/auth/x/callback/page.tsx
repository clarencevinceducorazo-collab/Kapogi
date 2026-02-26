'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { exchangeCodeForXUser } from '@/lib/identity-api';
import { LoaderCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function XCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Authenticating with X...');
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'security' | 'auth' | 'sandbox' | 'unknown' | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
      
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        console.error('X Auth Error:', errorParam, errorDescription);
        
        if (errorParam === 'access_denied') {
          setErrorType('sandbox');
          setError('Authorization denied or Sandbox restriction. If this isn\'t your developer account, you must be added as an "App Tester" in the X Developer Portal.');
        } else {
          setErrorType('auth');
          setError(errorDescription || `Authentication failed: ${errorParam}`);
        }
        setStatus('Authentication failed.');
        return;
      }

      const storedState = sessionStorage.getItem('pkce_state');
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      if (!code || !state || !storedState || !codeVerifier) {
        setErrorType('security');
        setError('Verification parameters are missing. The flow might have timed out.');
        setStatus('Verification failed.');
        return;
      }

      if (state !== storedState) {
        setErrorType('security');
        setError('Security mismatch. The response state did not match the request.');
        setStatus('Security check failed.');
        return;
      }

      // Cleanup
      sessionStorage.removeItem('pkce_state');
      sessionStorage.removeItem('pkce_code_verifier');

      try {
        setStatus('Fetching your profile...');
        const user = await exchangeCodeForXUser(code, codeVerifier);
        
        localStorage.setItem('x-auth-user', JSON.stringify(user));
        setStatus('Profile verified!');
        
        setTimeout(() => {
          window.close();
        }, 100);

      } catch (err: any) {
        console.error('Exchange Code Error:', err);
        setErrorType('auth');
        setError(err.message || 'Failed to communicate with X backend.');
        setStatus('Authentication failed.');
      }
    };

    if (typeof window !== "undefined") {
      handleAuth();
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-8 text-center font-sans">
      <div className="w-full max-w-lg bg-white border-4 border-black rounded-[2.5rem] p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-center mb-8">
            {error ? (
                <div className="w-20 h-20 rounded-[2rem] bg-red-50 flex items-center justify-center border-4 border-black">
                    {errorType === 'sandbox' ? <AlertTriangle className="w-10 h-10 text-amber-500" /> : <XCircle className="w-10 h-10 text-red-500" />}
                </div>
            ) : (
                 <LoaderCircle className="w-16 h-16 animate-spin text-blue-500" />
            )}
        </div>
        
        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800 mb-2">{status}</h1>
        
        {error ? (
            <div className="mt-6 text-left space-y-4">
                <div className="p-5 bg-red-50 border-2 border-red-200 rounded-2xl">
                    <p className="text-xs font-black uppercase text-red-400 tracking-widest mb-1">Error Message</p>
                    <p className="font-bold text-red-700 leading-tight">{error}</p>
                </div>

                {errorType === 'sandbox' && (
                  <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Info size={16} />
                      <p className="text-xs font-black uppercase tracking-widest">How to Fix</p>
                    </div>
                    <ol className="text-xs font-bold text-blue-700 space-y-2 list-decimal pl-4">
                      <li>Go to <span className="underline">developer.twitter.com</span></li>
                      <li>Select your App &gt; User authentication settings</li>
                      <li>Scroll to "App Testers" and add the other account handle</li>
                      <li>Accept the invitation on that other account</li>
                    </ol>
                  </div>
                )}

                <button 
                  onClick={() => window.close()}
                  className="w-full mt-4 bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors"
                >
                  Close Window
                </button>
            </div>
        ) : (
            <p className="mt-4 text-slate-400 font-bold uppercase text-xs tracking-widest animate-pulse">
                Please wait, linking your accounts...
            </p>
        )}
      </div>
    </div>
  );
}
