'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { BrutalCard } from '@/components/ui/brutal-card';
import { BrutalButton } from '@/components/ui/brutal-button';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import { LoaderCircle, CheckCircle, ShieldCheck, AlertCircle, Unlink, ExternalLink } from 'lucide-react';
import { loginWithX, getNonceToSign, verifyBinding, checkBinding, unbind } from '@/lib/identity-api';
import { useToast } from "@/hooks/use-toast";
import { formatAddress } from '@/lib/utils';

type Step = 'start' | 'wallet_connect' | 'sign_message' | 'verifying' | 'verified' | 'error' | 'already_bound';

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

export function IdentityBinder({ noCard = false }: { noCard?: boolean }) {
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

  // Auto-check for existing binding when a wallet is connected or X user changes
  useEffect(() => {
    const handleSync = async () => {
      if (!account?.address) {
        // If wallet disconnected, reset to start or x_login step
        if (step === 'already_bound' || step === 'sign_message') {
          setStep(xUser ? 'wallet_connect' : 'start');
        }
        return;
      }

      setIsLoading(true);
      try {
        const res = await checkBinding(account.address);
        if (res.bound) {
          setXUser({ id: res.x_uid!, name: '', username: res.x_username! });
          setStep('already_bound');
        } else {
          // Not bound. 
          // If we have an X user already, jump straight to sign step
          if (xUser) {
            setStep('sign_message');
          } else if (step !== 'error') {
            // If no X user, we need to authenticate with X first
            setStep('start');
          }
        }
      } catch (e) {
        console.error("Identity sync error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    handleSync();
  }, [account?.address, xUser?.id]); // Re-run when wallet address or X user changes

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'x-auth-user' && event.newValue) {
        try {
          const user = JSON.parse(event.newValue);
          setIsLoading(false);
          setXUser(user);
          // If wallet is already connected, the other useEffect will catch the xUser change and move to 'sign_message'
          if (!account?.address) {
            setStep('wallet_connect');
          }
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
  }, [account?.address]);

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
                setStep('already_bound');
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

  const handleUnbind = async () => {
    if (!account?.address) return;
    setIsLoading(true);
    try {
      const res = await unbind(account.address);
      if (res.success) {
        toast({ title: "Account Unlinked", description: "Binding has been removed." });
        setXUser(null);
        setStep('start');
      } else {
        throw new Error('Unbind failed');
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to unlink account." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRetry = () => {
    setErrorMessage('');
    setXUser(null);
    setStep('start');
  }

  // --- RENDER: ALREADY BOUND STATE ---
  if (step === 'already_bound' || step === 'verified') {
    const SuccessContent = (
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 bg-blue-500 rounded-[2rem] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-yellow-400 border-2 border-black rounded-lg p-1 animate-bounce">
            <CheckCircle size={16} />
          </div>
        </div>
        
        <h2 className="font-black text-3xl uppercase tracking-tighter italic mb-2">Identity Bound!</h2>
        
        <div className="bg-slate-50 border-4 border-black rounded-2xl p-6 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
              <iconify-icon icon="ri:twitter-x-fill" class="text-white text-2xl" />
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">X Account</p>
              <p className="font-black text-lg text-blue-500 truncate">@{xUser?.username}</p>
            </div>
          </div>
          <div className="h-px bg-slate-200 mb-4" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0">
              <iconify-icon icon="solar:wallet-bold" class="text-black text-2xl" />
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Wallet</p>
              <p className="font-mono text-xs font-bold text-slate-600 truncate">{formatAddress(account?.address || '')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <BrutalButton onClick={handleUnbind} disabled={isLoading} variant="danger" className="gap-2">
            {isLoading ? <LoaderCircle className="animate-spin" /> : <Unlink size={16} />}
            Unbind Account
          </BrutalButton>
        </div>
      </div>
    );

    return noCard ? SuccessContent : <BrutalCard>{SuccessContent}</BrutalCard>;
  }

  // --- RENDER: STANDARD FLOW ---
  const MainContent = (
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
          {xUser ? (
              <p className="text-sm font-bold text-green-600 mb-4 flex items-center gap-2">
                  <CheckCircle size={16} /> Authenticated as <span className="font-black">@{xUser.username}</span>. Connect your wallet.
              </p>
          ) : (
              <p className="text-sm font-bold text-gray-500 mb-4">
                  Connect your Sui wallet to complete the binding.
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
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Connected Wallet</p>
                  <p className="font-mono text-xs font-bold text-slate-600 truncate">{account.address}</p>
              </div>
          )}
          <BrutalButton onClick={handleSign} disabled={isLoading || !account} variant="purple" className="w-full sm:w-auto h-12 text-base">
            {isLoading ? <LoaderCircle className="animate-spin" /> : 'Sign & Complete Binding'}
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
  );

  return noCard ? MainContent : <BrutalCard>{MainContent}</BrutalCard>;
}
