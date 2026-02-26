
'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { BrutalCard } from '@/components/ui/brutal-card';
import { BrutalButton } from '@/components/ui/brutal-button';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import { LoaderCircle, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginWithX, getNonceToSign, verifyBinding } from '@/lib/identity-api';
import { useToast } from "@/hooks/use-toast";
import { formatAddress } from '@/lib/utils';

type Step = 'start' | 'wallet_connect' | 'sign_message' | 'verifying' | 'verified' | 'error';

interface XUser {
  id: string;
  name: string;
  username: string;
}

const StepCard = ({
  step,
  currentStep,
  title,
  children,
}: {
  step: number;
  currentStep: number;
  title: string;
  children: React.ReactNode;
}) => (
  <div
    className={`flex items-start gap-6 transition-all duration-500 ${
      currentStep < step ? 'opacity-30' : 'opacity-100'
    }`}
  >
    <div
      className={`flex-shrink-0 w-10 h-10 rounded-full border-4 flex items-center justify-center font-black text-lg transition-all duration-300 ${
        currentStep >= step
          ? 'bg-yellow-400 border-black text-black'
          : 'bg-gray-200 border-gray-300 text-gray-400'
      }`}
    >
      {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
    </div>
    <div className="flex-grow pt-1">
      <h3 className="font-black text-xl uppercase tracking-tight -mt-1">{title}</h3>
      <div
        className={`mt-4 transition-all duration-500 ${
          currentStep === step ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="pb-4">{children}</div>
      </div>
    </div>
  </div>
);

export function IdentityBinder() {
  const [step, setStep] = useState<Step>('start');
  const [xUser, setXUser] = useState<XUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const account = useCurrentAccount();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const { toast } = useToast();

  const currentStepNumber =
    step === 'start' ? 1
    : step === 'wallet_connect' ? 2
    : step === 'sign_message' ? 3
    : 4;

  useEffect(() => {
    if (account?.address && step === 'wallet_connect') {
      setStep('sign_message');
    }
  }, [account?.address, step]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'x-auth-user' && event.newValue) {
        try {
          const user = JSON.parse(event.newValue);
          setIsLoading(false);
          setXUser(user);
          setStep('wallet_connect');
          localStorage.removeItem('x-auth-user');
        } catch (e) {
          console.error('Failed to parse user data from storage', e);
          setErrorMessage('Failed to receive user data from X.');
          setStep('error');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLoginX = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await loginWithX();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect with X.');
      setStep('error');
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    if (!account?.address || !xUser) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const messageToSign = await getNonceToSign(account.address, xUser.username);
      
      signPersonalMessage(
        { message: new TextEncoder().encode(messageToSign) },
        {
          onSuccess: async (result) => {
            setStep('verifying');
            try {
              const verification = await verifyBinding({
                message: messageToSign,
                signature: result.signature,
                walletAddress: account.address,
                x_uid: xUser.id,
                x_username: xUser.username,
              });

              if (verification.success) {
                setStep('verified');
                toast({
                    title: "Identity Verified!",
                    description: `@${xUser.username} is now linked to your wallet.`,
                });
              } else if (verification.error === 'already_bound') {
                setStep('verified');
                toast({
                    title: "Connection Exists",
                    description: verification.message,
                });
              } else {
                throw new Error(verification.error || verification.message || 'Verification failed.');
              }
            } catch (err: any) {
                setErrorMessage(err.message || 'Verification failed on the backend.');
                setStep('error');
            } finally {
                setIsLoading(false);
            }
          },
          onError: () => {
            setErrorMessage('Signature rejected by user.');
            setStep('error');
            setIsLoading(false);
          },
        }
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to get signing message.');
      setStep('error');
      setIsLoading(false);
    }
  };
  
  const handleRetry = () => {
    setErrorMessage('');
    setXUser(null);
    setStep('start');
  }

  if (step === 'verified') {
    return (
        <BrutalCard className="text-center">
            <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4"/>
            <h2 className="font-black text-2xl uppercase text-green-600">Identity Verified</h2>
            <p className="text-gray-600 font-bold mt-2">
                Your X account <span className="text-blue-500">@{xUser?.username}</span> is securely bound to your wallet.
            </p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded-lg mt-4">{account?.address}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <BrutalButton onClick={handleRetry} variant="black">
                    Link Another
                </BrutalButton>
                <a href="/profile">
                    <BrutalButton variant="yellow">
                        View Profile
                    </BrutalButton>
                </a>
            </div>
        </BrutalCard>
    );
  }

  return (
    <BrutalCard>
      <div className="space-y-8">
        <StepCard step={1} currentStep={currentStepNumber} title="Authenticate with X">
            <p className="text-sm font-bold text-gray-500 mb-4">
                Prove you control your X (Twitter) account.
            </p>
            <BrutalButton onClick={handleLoginX} disabled={isLoading} variant="primary">
              {isLoading ? <LoaderCircle className="animate-spin" /> : 'Connect with X'}
            </BrutalButton>
        </StepCard>

        <StepCard step={2} currentStep={currentStepNumber} title="Connect Sui Wallet">
            {xUser && (
                <p className="text-sm font-bold text-gray-500 mb-4">
                    Welcome, <span className="text-blue-500 font-black">@{xUser.username}</span>. Now, select your wallet.
                </p>
            )}
            <CustomConnectButton />
        </StepCard>

        <StepCard step={3} currentStep={currentStepNumber} title="Sign to Verify">
             <p className="text-sm font-bold text-gray-500 mb-4">
                Final step: Create a secure cryptographic link. This is gas-free.
            </p>
            {account && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-3 rounded-xl mb-4">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Selected Wallet</p>
                    <p className="font-mono text-xs font-bold text-slate-600 truncate">{account.address}</p>
                </div>
            )}
            <BrutalButton onClick={handleSign} disabled={isLoading || !account} variant="purple">
              {isLoading ? <LoaderCircle className="animate-spin" /> : 'Sign & Complete'}
            </BrutalButton>
        </StepCard>

        {step === 'verifying' && (
            <div className="flex flex-col items-center justify-center gap-4 text-purple-600 font-bold p-8 text-center animate-pulse">
                <LoaderCircle className="animate-spin w-12 h-12"/>
                <span className="text-lg uppercase tracking-tight">Finalizing cryptographic link...</span>
            </div>
        )}

        {step === 'error' && (
            <div className="bg-red-50 border-4 border-black rounded-2xl p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                    <AlertCircle className="text-red-600" size={24} />
                </div>
                <h3 className="font-black text-xl text-red-600 uppercase italic">Verification Error</h3>
                <p className="text-red-700 font-bold mt-2 mb-6 text-sm leading-tight">{errorMessage}</p>
                <BrutalButton onClick={handleRetry} variant="danger">
                    Try Again
                </BrutalButton>
            </div>
        )}
      </div>
    </BrutalCard>
  );
}
