'use client';

import { useState, useEffect, useRef } from 'react';

export function StartingScreen() {
  const [isFinishing, setIsFinishing] = useState(false);
  const [progress, setProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const loadingBarRef = useRef<HTMLDivElement>(null);
  const loadingTextRef = useRef<HTMLSpanElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const whiteFlashRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainContentRef.current = document.getElementById('main-content');
    document.body.style.overflow = 'hidden';

    let fakeProgressInterval: NodeJS.Timeout;

    const handlePageLoaded = () => {
      clearInterval(fakeProgressInterval);
      setProgress(100);
    };

    // If the window is already loaded (e.g., fast connection, cached assets), finish immediately.
    if (document.readyState === 'complete') {
      handlePageLoaded();
    } else {
      window.addEventListener('load', handlePageLoaded, { once: true });
      
      // This provides a better UX than a static number.
      // It will animate up to 99% and wait for the 'load' event.
      let currentFakeProgress = 0;
      fakeProgressInterval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 99) {
                clearInterval(fakeProgressInterval);
                return 99;
            }
            // Simulate a slower load in the middle
            const increment = (prev < 60) ? Math.random() * 3 : Math.random() * 0.5;
            return Math.min(prev + increment, 99);
        });
      }, 150);
    }
    
    // Cleanup function to remove event listeners and intervals
    return () => {
      window.removeEventListener('load', handlePageLoaded);
      clearInterval(fakeProgressInterval);
      // Ensure body scroll is restored if component unmounts unexpectedly
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let w = window.innerWidth;
    let h = window.innerHeight;
    const setCanvasSize = () => {
      canvas.width = w = window.innerWidth;
      canvas.height = h = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    const drawLightning = () => {
      if (Math.random() > 0.95 || !ctx) return;
      ctx.strokeStyle = `rgba(167, 139, 250, ${Math.random() * 0.4 + 0.1})`;
      ctx.lineWidth = Math.random() * 2;
      ctx.beginPath();
      let x = Math.random() * w;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < h) {
        x += (Math.random() - 0.5) * 50;
        y += Math.random() * 20 + 10;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      setTimeout(() => ctx.clearRect(0, 0, w, h), 100);
    };
    const lightningInterval = setInterval(drawLightning, 50);

    const particleContainer = particleContainerRef.current;
    const particleColors = ['rgba(139, 92, 246, ', 'rgba(59, 130, 246, ', 'rgba(255, 255, 255, '];
    const createParticle = () => {
      if (!particleContainer) return;
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 4 + 1;
      p.style.cssText = `
        position: absolute; border-radius: 50%; pointer-events: none;
        width: ${size}px; height: ${size}px; left: ${Math.random() * 100}%; bottom: -10px;
        background: ${particleColors[Math.floor(Math.random() * particleColors.length)]}${Math.random() * 0.5 + 0.1});
        box-shadow: 0 0 ${size * 2}px ${particleColors[0]}0.4);
        animation: float-up ${Math.random() * 3 + 2}s linear forwards;
      `;
      particleContainer.appendChild(p);
      setTimeout(() => p.remove(), (Math.random() * 3 + 2) * 1000);
    };
    const particleInterval = setInterval(createParticle, 50);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      clearInterval(lightningInterval);
      clearInterval(particleInterval);
    };
  }, []);
  
  useEffect(() => {
    if (loadingBarRef.current) loadingBarRef.current.style.width = `${progress}%`;
    if (loadingTextRef.current) loadingTextRef.current.innerText = `${Math.floor(progress)}%`;

    if (progress >= 100 && !isFinishing) {
      setIsFinishing(true);
      setTimeout(() => {
        if (sealRef.current) {
          sealRef.current.style.transition = 'transform 0.5s ease-in, opacity 0.5s ease-in, filter 0.5s ease-in';
          sealRef.current.style.transform = 'translate(-50%, -50%) scale(2.5)';
          sealRef.current.style.opacity = '0';
          sealRef.current.style.filter = 'brightness(500%) drop-shadow(0 0 100px white)';
        }
        setTimeout(() => {
          if (whiteFlashRef.current) whiteFlashRef.current.style.opacity = '1';
          setTimeout(() => {
            if (mainContentRef.current) mainContentRef.current.style.opacity = '1';
            document.body.style.overflow = '';
            if (containerRef.current) {
              containerRef.current.style.opacity = '0';
              containerRef.current.style.pointerEvents = 'none';
            }
            setTimeout(() => {
              if (whiteFlashRef.current) whiteFlashRef.current.style.opacity = '0';
            }, 200);
          }, 800);
        }, 400);
      }, 500);
    }
  }, [progress, isFinishing]);

  return (
      <div ref={containerRef} className="fixed inset-0 z-[1000] flex flex-col items-center justify-center overflow-hidden bg-slate-950 transition-opacity duration-500">
        <div ref={whiteFlashRef} className="fixed inset-0 z-[100] bg-white pointer-events-none opacity-0 transition-opacity duration-[1500ms] ease-out"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-950/40 via-slate-950/80 to-slate-950 z-0"></div>
        <div className="absolute inset-0 opacity-30 mix-blend-screen bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0"></div>
        <div className="absolute inset-0 z-1 opacity-20 bg-gradient-to-r from-transparent via-violet-900/20 to-transparent" style={{animation: 'mist-flow 10s ease-in-out infinite'}}></div>
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 opacity-40"></canvas>
        <div className="relative z-20 flex flex-col items-center justify-center w-full h-full">
            <div ref={sealRef} className="relative w-[600px] h-[600px] md:w-[800px] md:h-[800px] opacity-80 scale-75 md:scale-100 transition-all duration-1000">
                <div className="summon-circle w-full h-full border border-dashed border-slate-700/50" style={{animation: 'spin-slow 60s linear infinite'}}></div>
                <div className="summon-circle w-[70%] h-[70%] border border-slate-600/30" style={{animation: 'spin-reverse-slow 40s linear infinite'}}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 p-2"><iconify-icon icon="solar:star-fall-linear" className="text-violet-400 text-xl"></iconify-icon></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-slate-950 p-2"><iconify-icon icon="solar:moon-linear" className="text-violet-400 text-xl"></iconify-icon></div>
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 p-2"><iconify-icon icon="solar:sun-2-linear" className="text-violet-400 text-xl"></iconify-icon></div>
                    <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-slate-950 p-2"><iconify-icon icon="solar:planet-linear" className="text-violet-400 text-xl"></iconify-icon></div>
                </div>
                <div className="summon-circle w-[45%] h-[45%] border border-violet-500/40 shadow-[0_0_30px_rgba(139,92,246,0.2)]" style={{animation: 'spin-slow 20s linear infinite'}}>
                    <div className="absolute inset-0 rotate-45 border border-transparent border-t-violet-400/60 border-b-violet-400/60"></div>
                </div>
                <div className="center-abs w-[200px] h-[200px] bg-violet-600/10 blur-[60px] rounded-full animate-pulse"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-30 mix-blend-screen">
                <h1 className="font-fantasy font-extrabold text-6xl md:text-8xl tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-violet-100 to-violet-300 text-glow drop-shadow-2xl">
                    KAPOGIAN
                </h1>
                <p className="font-fantasy text-xs md:text-sm tracking-[0.3em] text-violet-300/60 mt-4 uppercase">
                    Awaken the Ancient
                </p>
            </div>
            <div className="absolute bottom-16 md:bottom-24 w-full max-w-md px-8 flex flex-col items-center gap-3 z-30">
                <div className="w-full flex justify-between items-end mb-1">
                    <span className="text-xs font-medium text-slate-500 tracking-wider">LOADING ASSETS</span>
                    <span ref={loadingTextRef} className="text-lg font-fantasy font-semibold text-violet-200 tabular-nums">0%</span>
                </div>
                <div className="relative w-full h-1 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                    <div ref={loadingBarRef} className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-600 via-blue-400 to-white rounded-full w-0 transition-all duration-100 ease-out"></div>
                </div>
                <div className="mt-4 flex gap-2 items-center opacity-40">
                    <iconify-icon icon="solar:info-square-linear" className="text-slate-400"></iconify-icon>
                    <span className="text-xs text-slate-400 font-light">Summoning spirits from the void...</span>
                </div>
            </div>
        </div>
        <div ref={particleContainerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-10"></div>
      </div>
  );
}
