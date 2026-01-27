'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { WandSparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { IntroSection } from '@/components/kapogian/intro-section';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

export function HeroSection() {
  const [characterName, setCharacterName] = useState('Tzar');
  const [randomFigureId, setRandomFigureId] = useState('????');
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setRandomFigureId(String(Math.floor(Math.random() * 9000) + 1000));
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left - width / 2) / (width / 2);
    const y = (clientY - top - height / 2) / (height / 2);
    setTilt({ x: y * -6, y: x * 6 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div ref={ref} className="bg-white comic-border-thick rounded-[2.5rem] overflow-hidden toy-shadow-lg mb-12 relative">
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-[hsl(var(--brand-yellow))] comic-border rounded-full z-20 flex items-center justify-center">
        <div className="w-16 h-2 bg-black rounded-full"></div>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-8 md:p-12 md:pr-0 flex flex-col justify-center relative z-10 pt-20">
          <div className={cn('inline-block self-start bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest rounded mb-4 transform -rotate-2 opacity-0', inView && 'animate-pop-in')} style={{ animationDelay: '0s' }}>
            Series 1 • 2026 Edition
          </div>
          <h1 className="text-[5rem] leading-[0.85] text-primary text-outline mb-4 transform -rotate-1 origin-bottom-left"> 
            <span className={cn('inline-block opacity-0', inView && 'animate-pop-in')} style={{ animationDelay: '0.1s' }}>KAPO</span>
            <br/>
            <span className={cn('inline-block opacity-0', inView && 'animate-pop-in')} style={{ animationDelay: '0.2s' }}>GIAN</span>
          </h1>
          <p className={cn('font-headline text-2xl text-slate-800 mb-6 max-w-sm leading-tight opacity-0', inView && 'animate-pop-in')} style={{ animationDelay: '0.3s' }}>
            Your Digital Identity.<br/>
            <span className="text-accent">Now in Physical Reality.</span>
          </p>
          <p className={cn('font-medium text-slate-600 mb-8 max-w-sm leading-relaxed border-l-4 border-[hsl(var(--brand-yellow))] pl-4 opacity-0', inView && 'animate-pop-in')} style={{ animationDelay: '0.4s' }}>
            Generate a 1-of-1 character. Mint on SUI. Receive exclusive merchandise delivered to your door.
          </p>
          <div className={cn('flex gap-4 opacity-0', inView && 'animate-pop-in')} style={{ animationDelay: '0.5s' }}>
            <Link href="/generate">
              <Button
                className="bg-[hsl(var(--brand-yellow))] hover:bg-yellow-300 text-black comic-border rounded-xl px-6 py-3 font-headline text-xl toy-shadow flex items-center gap-2 h-auto text-center"
              >
                <WandSparkles />
                Simulan Ang Pagiging Pogi
              </Button>
            </Link>
          </div>
        </div>

        <div 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1)`,
            transition: 'transform 0.1s linear',
          }}
          className={`w-full md:w-1/2 p-8 md:p-12 relative transition-all duration-800 delay-300 ease-premium-ease ${inView ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-95 -rotate-2'}`}>
          <div className="bg-[#f0f4f8] comic-border rounded-[2rem] h-[400px] relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 blister-pack rounded-[1.8rem] z-20 pointer-events-none"></div>
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "15px 15px"}}></div>
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="sticker-cut bg-white p-2 rounded-3xl comic-border">
                <div className="w-48 h-48 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-slate-200 relative">
                  <Image src="/images/KPG.png" alt="Kapogian character" width={192} height={192} className="object-cover w-full h-full" />
                </div>
                <div className="mt-2 text-center">
                  <span className="font-headline text-xl block">{characterName}</span>
                  <span className="text-xs font-bold uppercase text-slate-400">Figure #{randomFigureId}</span>
                </div>
              </div>
            </div>
            <div className="absolute top-6 right-6 z-30 bg-primary text-white w-20 h-20 rounded-full flex items-center justify-center comic-border shadow-lg transform rotate-12 animate-spin-subtle">
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
