'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { WandSparkles, UserRound, LoaderCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { IntroSection } from '@/components/kapogian/intro-section';

export function HeroSection() {
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState('MYSTERY');
  const [randomFigureId, setRandomFigureId] = useState('????');
  const [isPending, setIsPending] = useState(false); // Keep pending state for UI feedback if needed

  useEffect(() => {
    // Generate random figure ID on client to prevent hydration mismatch
    setRandomFigureId(String(Math.floor(Math.random() * 9000) + 1000));
  }, []);

  return (
    <div className="bg-white comic-border-thick rounded-[2.5rem] overflow-hidden toy-shadow-lg mb-12 relative">
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-[hsl(var(--brand-yellow))] comic-border rounded-full z-20 flex items-center justify-center">
        <div className="w-16 h-2 bg-black rounded-full"></div>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-8 md:p-12 md:pr-0 flex flex-col justify-center relative z-10 pt-20">
          <div className="inline-block self-start bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest rounded mb-4 transform -rotate-2">
            Series 1 • 2024 Edition
          </div>
          <h1 className="text-[5rem] leading-[0.85] text-primary text-outline mb-4 transform -rotate-1 origin-bottom-left">
            KAPO<br/>GIAN
          </h1>
          <p className="font-headline text-2xl text-slate-800 mb-6 max-w-sm leading-tight">
            Your Digital Identity.<br/>
            <span className="text-accent">Now in Physical Reality.</span>
          </p>
          <p className="font-medium text-slate-600 mb-8 max-w-sm leading-relaxed border-l-4 border-[hsl(var(--brand-yellow))] pl-4">
            Generate a 1-of-1 character. Mint on SUI. Receive exclusive merchandise delivered to your door.
          </p>
          <div className="flex gap-4">
            <Link href="/generate">
              <Button
                className="bg-[hsl(var(--brand-yellow))] hover:bg-yellow-300 text-black comic-border rounded-xl px-6 py-3 font-headline text-xl toy-shadow flex items-center gap-2 h-auto text-center"
              >
                <WandSparkles />
                Start
              </Button>
            </Link>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 relative">
          <div className="bg-[#f0f4f8] comic-border rounded-[2rem] h-[400px] relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 blister-pack rounded-[1.8rem] z-20 pointer-events-none"></div>
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "15px 15px"}}></div>
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="sticker-cut bg-white p-2 rounded-3xl comic-border transform rotate-2">
                <div className="w-48 h-48 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-slate-200 relative">
                  {isPending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                      <LoaderCircle className="w-16 h-16 text-slate-400 animate-spin"/>
                    </div>
                  )}
                  {characterImage ? (
                     <Image src={characterImage} alt="Generated character" width={192} height={192} className="object-cover w-full h-full" />
                  ) : (
                    <UserRound className="w-20 h-20 text-slate-300" strokeWidth={1} />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <span className="font-headline text-xl block">{characterName}</span>
                  <span className="text-xs font-bold uppercase text-slate-400">Figure #{randomFigureId}</span>
                </div>
              </div>
            </div>
            <div className="absolute top-6 right-6 z-30 bg-primary text-white w-20 h-20 rounded-full flex items-center justify-center comic-border shadow-lg transform rotate-12">
              <div className="text-center leading-none">
                <span className="block text-xs font-bold">100%</span>
                <span className="font-headline text-lg">ON CHAIN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="panel-divider"></div>
      <div className="bg-[#ffec99] p-8 md:p-12">
        <IntroSection />
      </div>
    </div>
  );
}
