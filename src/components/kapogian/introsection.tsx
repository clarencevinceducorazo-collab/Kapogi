'use client';

import { useEffect } from 'react';

interface TestModalProps {
  onClose: () => void;
}

export function TestModal({ onClose }: TestModalProps) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/10"
        style={{ animation: 'vincePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎮</span>
            <div>
              <p className="text-white font-black text-lg leading-none tracking-tight">
                Cheat Code Activated!
              </p>
              <p className="text-white/70 text-xs font-semibold mt-0.5 uppercase tracking-widest">
                secret unlocked
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:rotate-90 active:scale-90 text-white font-black text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="bg-slate-900 px-6 py-8 flex flex-col items-center text-center gap-4">
          {/* Glowing avatar placeholder */}
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-40 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-5xl shadow-xl border-4 border-yellow-300/30">
              👑
            </div>
          </div>

          <div>
            <h2 className="text-white font-black text-2xl tracking-tight">
              Hey, User! 👋
            </h2>
            <p className="text-white/50 text-sm font-semibold mt-1">
              You found the secret easter egg.
            </p>
          </div>

          <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
            <p className="text-yellow-300 text-sm font-black uppercase tracking-widest mb-1">
              🏆 Achievement Unlocked
            </p>
            <p className="text-white/70 text-xs font-semibold leading-relaxed">
              "The Architect" — You typed the secret word and discovered the hidden chamber of Kapogian.
            </p>
          </div>

          {/* Fake stats */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              { label: 'Rarity', value: '1/1', color: 'text-yellow-400' },
              { label: 'Power', value: '9999', color: 'text-cyan-400' },
              { label: 'Rank', value: '#1', color: 'text-pink-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl py-3 flex flex-col items-center gap-1">
                <span className={`font-black text-lg ${color}`}>{value}</span>
                <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">{label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black uppercase tracking-wider py-3 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-orange-500/20 text-sm"
          >
            Nice, let's go! 🚀
          </button>
        </div>
      </div>

      <style>{`
        @keyframes vincePop {
          from { opacity: 0; transform: scale(0.7) rotate(-4deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}