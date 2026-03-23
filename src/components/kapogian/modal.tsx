'use client';

import { useEffect } from 'react';

interface TestModalProps {
  onClose: () => void;
}

const team = [
  { name: 'Raven Caguioa',          role: 'Backend Developer',                     emoji: '⚙️' },
  { name: 'Clarence Vince Razo',    role: 'Frontend & Creative Developer',          emoji: '🎨' },
  { name: 'Xyrille Navora',         role: 'Frontend Developer',                     emoji: '💻' },
  { name: 'Gelo Rioflorido',        role: 'Website Tester',                         emoji: '🧪' },
];

export function TestModal({ onClose }: TestModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

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
                Developers Activated!
              </p>
              <p className="text-white/70 text-xs font-semibold mt-0.5 uppercase tracking-widest">
                secret unlocked
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:rotate-90 active:scale-90 text-white font-black text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="bg-slate-900 px-6 py-6 flex flex-col gap-5">

          {/* Title */}
          <div className="text-center">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-1">
              Behind the Magic
            </p>
            <h2 className="text-white font-black text-xl tracking-tight">
              Meet the Team 🏆
            </h2>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-white/10" />

          {/* Team list */}
          <div className="flex flex-col gap-3">
            {team.map(({ name, role, emoji }) => (
              <div
                key={name}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 hover:bg-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-white/10 flex items-center justify-center text-xl shrink-0">
                  {emoji}
                </div>
                <div className="text-left">
                  <p className="text-white font-black text-sm leading-none mb-1">{name}</p>
                  <p className="text-white/40 text-[11px] font-semibold">{role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black uppercase tracking-wider py-3 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-orange-500/20 text-sm"
          >
            Be Pogi, Be Confidence! 🚀
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