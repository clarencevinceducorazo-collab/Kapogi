'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useConnectWallet, useWallets, useSuiClient } from '@mysten/dapp-kit';
import { cn } from '@/lib/utils';
import { Lock, Wallet, Eye, EyeOff, CheckCircle, AlertCircle, LoaderCircle } from 'lucide-react';

interface StorageGateProps {
  onUnlocked: () => void;
}

type Stage = 'connect' | 'checking' | 'password';

export function StorageGate({ onUnlocked }: StorageGateProps) {
  const [stage, setStage] = useState<Stage>('connect');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState(false);

  const account = useCurrentAccount();
  const { mutate: connectWallet } = useConnectWallet();
  const wallets = useWallets();
  const client = useSuiClient();

  const ADMIN_CAP_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_CAP_ID!;
  const SECRET = "kapogian2026"

  // Auto-check when wallet connects
  useEffect(() => {
    if (account) checkAdminCap();
  }, [account]);

  const checkAdminCap = async () => {
    setStage('checking');
    try {
      const objects = await client.getOwnedObjects({
        owner: account!.address,
        filter: { ObjectId: ADMIN_CAP_ID },
        options: { showType: true },
      });
      if (objects.data.length > 0) {
        // Has AdminCap — unlock immediately
        onUnlocked();
      } else {
        // No AdminCap — fall back to password
        setStage('password');
      }
    } catch {
      setStage('password');
    }
  };

  const handleConnect = () => {
    connectWallet({ wallet: wallets[0] });
    // useEffect above picks up the account change and calls checkAdminCap
  };

  const tryPassword = () => {
    if (password === SECRET) {
      onUnlocked();
    } else {
      setPwError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100 via-yellow-50 to-white scale-105 blur-md" />
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(20px) saturate(1.4)' }}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-sm rounded-[2.5rem] p-10 border-2 border-white/90"
          style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px)' }}
        >
          {/* Icon */}
          <div className="w-14 h-14 bg-sky-50 border-2 border-sky-100 rounded-[1.2rem] flex items-center justify-center mx-auto mb-5">
            {stage === 'checking'
              ? <LoaderCircle size={22} className="text-sky-500 animate-spin" />
              : stage === 'password'
              ? <Lock size={22} className="text-sky-500" />
              : <Wallet size={22} className="text-sky-500" />
            }
          </div>

          <p className="text-center text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1">
            Kapogian Storage
          </p>

          <h2 className="text-center text-xl font-black text-slate-800 uppercase italic mb-1">
            {stage === 'connect' && 'Private Vault'}
            {stage === 'checking' && 'Verifying…'}
            {stage === 'password' && 'Enter Password'}
          </h2>

          <p className="text-center text-xs text-slate-400 mb-8">
            {stage === 'connect' && 'Connect your Sui wallet to check admin access.'}
            {stage === 'checking' && 'Checking AdminCap on Sui…'}
            {stage === 'password' && 'Your wallet is not a super admin. Enter the password to continue.'}
          </p>

          {/* — CONNECT — */}
          {stage === 'connect' && (
            <button
              onClick={handleConnect}
              className="w-full h-12 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl text-xs shadow-[4px_4px_0_0_#0ea5e9] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Wallet size={16} /> Connect Sui Wallet
            </button>
          )}

          {/* — CHECKING — */}
          {stage === 'checking' && (
            <div className="flex flex-col items-center gap-2 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Reading wallet objects…
              </p>
            </div>
          )}

          {/* — PASSWORD — */}
          {stage === 'password' && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && tryPassword()}
                  placeholder="Enter password…"
                  autoFocus
                  className={cn(
                    'w-full h-12 bg-white/60 border-2 rounded-2xl px-4 pr-12 text-sm font-medium outline-none transition-all',
                    pwError ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-sky-300'
                  )}
                />
                <button
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {pwError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2 text-xs font-bold text-red-400 text-center">
                  Incorrect password. Try again.
                </div>
              )}

              <button
                onClick={tryPassword}
                className="w-full h-12 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl text-xs shadow-[4px_4px_0_0_#0ea5e9] hover:bg-slate-800 transition-all"
              >
                Unlock
              </button>

              {/* Let them retry with a different wallet */}
              <button
                onClick={() => setStage('connect')}
                className="w-full h-9 text-slate-300 font-black uppercase tracking-widest text-[10px] hover:text-slate-500 transition-all"
              >
                ← Try a different wallet
              </button>
            </div>
          )}

          <p className="text-center text-[10px] text-slate-200 mt-7 tracking-widest uppercase">
            Protected · Sui Network
          </p>
        </div>
      </div>
    </div>
  );
}