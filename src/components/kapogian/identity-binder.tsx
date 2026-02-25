'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { BrutalCard } from '@/components/ui/brutal-card';
import { BrutalButton } from '@/components/ui/brutal-button';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import { LoaderCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { loginWithX, getNonceToSign, verifyBinding } from '@/lib/identity-api';
import { useToast } from "@/hooks/use-toast";
import { formatAddress } from '@/lib/utils';

type Step = 'start' | 'wallet_connect' | 'sign_message' | 'verifying' | 'verified' | 'error';

interface XUser {
  id: string;
  name: string;
  username: string;
}

// A helper component for each step in the flow
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
          currentStep === step ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
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

  const handleLoginX = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = await loginWithX();
      setXUser(user);
      setStep('wallet_connect');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect with X.');
      setStep('error');
    } finally {
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
              } else {
                throw new Error(verification.message);
              }
            } catch (err: any) {
                setErrorMessage(err.message || 'Verification failed on the backend.');
                setStep('error');
            } finally {
                setIsLoading(false);
            }
          },
          onError: (err) => {
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
            <BrutalButton onClick={handleRetry} className="mt-6" variant="black">
                Bind Another
            </BrutalButton>
        </BrutalCard>
    );
  }

  return (
    <BrutalCard>
      <div className="space-y-8">
        <StepCard step={1} currentStep={currentStepNumber} title="Authenticate with X">
            <p className="text-sm font-bold text-gray-500 mb-4">
                Login with your X (Twitter) account to start the binding process.
            </p>
            <BrutalButton onClick={handleLoginX} disabled={isLoading} variant="primary">
              {isLoading ? <LoaderCircle className="animate-spin" /> : 'Login with X'}
            </BrutalButton>
        </StepCard>

        <StepCard step={2} currentStep={currentStepNumber} title="Connect Sui Wallet">
            {xUser && (
                <p className="text-sm font-bold text-gray-500 mb-4">
                    Logged in as <span className="text-blue-500 font-black">@{xUser.username}</span>. Now, connect your Sui wallet.
                </p>
            )}
            <CustomConnectButton />
        </StepCard>

        <StepCard step={3} currentStep={currentStepNumber} title="Sign to Verify">
             <p className="text-sm font-bold text-gray-500 mb-4">
                Sign a message with your wallet to prove ownership. This is a gas-free transaction.
            </p>
            {account && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-3 rounded-xl mb-4">
                    <p className="text-xs font-bold text-gray-500">Wallet Address:</p>
                    <p className="font-mono text-sm">{formatAddress(account.address)}</p>
                </div>
            )}
            <BrutalButton onClick={handleSign} disabled={isLoading} variant="purple">
              {isLoading ? <LoaderCircle className="animate-spin" /> : 'Sign & Verify'}
            </BrutalButton>
        </StepCard>

        {step === 'verifying' && (
            <div className="flex items-center justify-center gap-4 text-purple-600 font-bold p-8">
                <LoaderCircle className="animate-spin w-8 h-8"/>
                <span className="text-xl">Verifying your signature on-chain...</span>
            </div>
        )}

        {step === 'error' && (
            <div className="bg-red-50 border-4 border-dashed border-red-300 p-6 rounded-2xl text-center">
                <h3 className="font-black text-xl text-red-600">An Error Occurred</h3>
                <p className="text-red-700 font-medium mt-2 mb-4">{errorMessage}</p>
                <BrutalButton onClick={handleRetry} variant="danger">
                    Try Again
                </BrutalButton>
            </div>
        )}
      </div>
    </BrutalCard>
  );
}
