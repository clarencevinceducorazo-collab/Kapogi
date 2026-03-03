'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { BrutalCard } from '@/components/ui/brutal-card';
import { BrutalButton } from '@/components/ui/brutal-button';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import { LoaderCircle, CheckCircle, ShieldCheck, AlertCircle, Unlink, Twitter, LogOut, LayoutDashboard } from 'lucide-react';
import { getNonceToSign, verifyBinding, checkBinding, checkBindingByXUid, unbind } from '@/lib/identity-api';
import { useToast } from "@/hooks/use-toast";
import { formatAddress } from '@/lib/utils';
import Link from 'next/link';

type Step = 'start' | 'wallet_connect' | 'sign_message' | 'verifying' | 'verified' | 'error' | 'already_bound';

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
  const { data: session, status: sessionStatus } = useSession();
  const account = useCurrentAccount();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('start');
  const [boundData, setBoundData] = useState<{ x_username?: string; sui_address?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentStepNumber =
    step === 'start' ? 1
    : step === 'wallet_connect' ? 2
    : step === 'sign_message' ? 3
    : 4;

  const hasSynced = useRef(false);

  useEffect(() => {
    // Don't run while session is still loading
    if (sessionStatus === 'loading') return;
    
    // Don't run again if already synced
    if (hasSynced.current) return;
    hasSynced.current = true;

    const handleSync = async () => {
      setIsLoading(true);
      try {
        // Check by wallet address first
        if (account?.address) {
          const res = await checkBinding(account.address);
          if (res.bound) {
            setBoundData({ 
              x_username: res.x_username, 
              sui_address: account.address 
            });
            setStep('already_bound');
            return;
          }
        }

        // Check by X UID
        if (session?.user?.x_uid) {
          const res = await checkBindingByXUid(session.user.x_uid);
          if (res.bound) {
            setBoundData({ 
              x_username: res.x_username, 
              sui_address: res.sui_address 
            });
            setStep('already_bound');
            return;
          }
          if (account?.address) {
            setStep('sign_message');
          } else {
            setStep('wallet_connect');
          }
          return;
        }

        setStep('start');
      } catch (e) {
        console.error('Sync error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    handleSync();
  }, [sessionStatus, account?.address, session?.user?.x_uid]);

  // Reset hasSynced when wallet or session changes so it re-checks
  useEffect(() => {
    hasSynced.current = false;
  }, [account?.address, session?.user?.x_uid]);

  const handleSign = async () => {
    if (!account?.address || !session?.user?.x_username || !session?.user?.x_uid) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const x_username = session.user.x_username;
      const x_uid = session.user.x_uid;
      const messageToSign = await getNonceToSign(account.address, x_username);
      
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
                x_uid,
                x_username,
              });

              if (verification.success) {
                setBoundData({ x_username, sui_address: account.address });
                setStep('verified');
                toast({ title: "Identity Verified!", description: `@${x_username} is now linked to your wallet.` });
              } else if (verification.error === 'already_bound') {
                setStep('already_bound');
                toast({ title: "Connection Exists", description: verification.message });
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
        setBoundData(null);
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

  const MainContent = (
    <div className="space-y-8">
      <StepCard step={1} currentStep={currentStepNumber} title="Login with X">
          <p className="text-sm font-bold text-gray-500 mb-4">
              Authenticate your X (Twitter) account to start the binding process.
          </p>
          {session?.user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-blue-50 border-2 border-blue-200 p-3 rounded-xl">
                <Twitter className="text-blue-500" size={20} />
                <span className="font-black text-blue-700">@{session.user.x_username}</span>
                <CheckCircle className="text-blue-500 ml-auto" size={18} />
              </div>
              <BrutalButton onClick={() => signOut()} variant="danger" className="w-full sm:w-auto h-9 text-[10px] gap-2">
                <LogOut size={14} /> Logout from X
              </BrutalButton>
            </div>
          ) : (
            <BrutalButton onClick={() => signIn('twitter')} variant="primary" className="gap-2">
              <Twitter size={18} /> Login with X
            </BrutalButton>
          )}
      </StepCard>

      <StepCard step={2} currentStep={currentStepNumber} title="Connect Sui Wallet">
          <p className="text-sm font-bold text-gray-500 mb-4">
              Connect the wallet you want to link to your X account.
          </p>
          <CustomConnectButton />
      </StepCard>

      <StepCard step={3} currentStep={currentStepNumber} title="Sign to Verify">
           <p className="text-sm font-bold text-gray-500 mb-4">
              Create a secure cryptographic link. This is gas-free.
          </p>
          {account && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-3 rounded-xl mb-4">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Connected Wallet</p>
                  <p className="font-mono text-xs font-bold text-slate-600 truncate">{account.address}</p>
              </div>
          )}
          <BrutalButton onClick={handleSign} disabled={isLoading || !account || !session} variant="purple" className="w-full sm:w-auto h-12 text-base">
            {isLoading ? <LoaderCircle className="animate-spin" /> : 'Sign & Link Account'}
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
              <h3 className="font-black text-xl text-red-600 uppercase italic">Binding Error</h3>
              <p className="text-red-700 font-bold mt-2 mb-6 text-sm leading-tight">{errorMessage}</p>
              <BrutalButton onClick={() => setStep('start')} variant="danger">Try Again</BrutalButton>
          </div>
      )}
    </div>
  );

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
              <Twitter className="text-white text-2xl" />
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">X Account</p>
              <p className="font-black text-lg text-blue-500 truncate">@{boundData?.x_username}</p>
            </div>
          </div>
          <div className="h-px bg-slate-200 mb-4" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0">
              <iconify-icon icon="solar:wallet-bold" class="text-black text-2xl" />
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Wallet</p>
              <p className="font-mono text-xs font-bold text-slate-600 truncate">{formatAddress(boundData?.sui_address || '')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/profile">
            <BrutalButton variant="primary" className="w-full sm:w-auto gap-2">
              <LayoutDashboard size={16} /> View Profile
            </BrutalButton>
          </Link>
          <BrutalButton onClick={handleUnbind} disabled={isLoading} variant="danger" className="w-full sm:w-auto gap-2">
            {isLoading ? <LoaderCircle className="animate-spin" /> : <Unlink size={16} />}
            Unbind Account
          </BrutalButton>
          {session?.user && (
            <BrutalButton onClick={() => signOut()} variant="default" className="w-full sm:w-auto gap-2">
              <LogOut size={16} /> Logout from X
            </BrutalButton>
          )}
        </div>
      </div>
    );

    return noCard ? SuccessContent : <BrutalCard>{SuccessContent}</BrutalCard>;
  }

  return noCard ? MainContent : <BrutalCard>{MainContent}</BrutalCard>;
}
