'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// I have to define IconifyIcon for typescript since it's not a standard element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        icon: string;
        width?: string;
        class?: string;
      };
    }
  }
}

export function StartingScreen() {
  const [isFinishing, setIsFinishing] = useState(false);
  const [progress, setProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const loadingUiRef = useRef<HTMLDivElement>(null); 
  const whiteFlashRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainContentRef.current = document.getElementById('main-content');
    document.body.style.overflow = 'hidden';

    let fakeProgressInterval: NodeJS.Timeout;

    const handlePageLoaded = () => {
      clearInterval(fakeProgressInterval);
      setProgress(100);
    };

    if (document.readyState === 'complete') {
      handlePageLoaded();
    } else {
      window.addEventListener('load', handlePageLoaded, { once: true });
      
      let currentFakeProgress = 0;
      fakeProgressInterval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 99) {
                clearInterval(fakeProgressInterval);
                return 99;
            }
            const increment = (prev < 60) ? Math.random() * 3 : Math.random() * 0.5;
            return Math.min(prev + increment, 99);
        });
      }, 150);
    }
    
    return () => {
      window.removeEventListener('load', handlePageLoaded);
      clearInterval(fakeProgressInterval);
      if (document.body) {
        document.body.style.overflow = '';
      }
    };
  }, []);

  useEffect(() => {
    // This effect handles the final animation sequence
    if (progress >= 100 && !isFinishing) {
      setIsFinishing(true);

      // Hide the loading bar UI first
      if (loadingUiRef.current) {
          loadingUiRef.current.style.transition = 'opacity 0.5s ease-out';
          loadingUiRef.current.style.opacity = '0';
      }

      // Start the flash effect after a short delay
      setTimeout(() => {
        if (whiteFlashRef.current) {
            whiteFlashRef.current.style.opacity = '1';
        }
        
        // After the flash, reveal the main content and hide the loading screen
        setTimeout(() => {
          if (mainContentRef.current) {
            mainContentRef.current.style.opacity = '1';
          }
          if (document.body) {
            document.body.style.overflow = '';
          }
          if (containerRef.current) {
            containerRef.current.style.opacity = '0';
            containerRef.current.style.pointerEvents = 'none';
          }

          // Fade the flash out
          setTimeout(() => {
            if (whiteFlashRef.current) {
                whiteFlashRef.current.style.opacity = '0';
            }
          }, 200);

        }, 800); // Duration of the white flash
      }, 500); // Delay before flashing
    }
  }, [progress, isFinishing]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[1000] overflow-hidden bg-gradient-to-b from-sky-200 via-indigo-50 to-white text-slate-700 font-body">
        <div ref={whiteFlashRef} className="fixed inset-0 z-[100] bg-white pointer-events-none opacity-0 transition-opacity duration-[1500ms] ease-out"></div>
        
        {/* Floating Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-10 right-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{animationDelay: '2s'}}></div>
            <div className="absolute -bottom-32 left-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{animationDelay: '4s'}}></div>
            
            <iconify-icon icon="solar:cloud-bold" className="absolute top-20 left-[10%] text-white opacity-40 text-9xl animate-float-delayed"></iconify-icon>
            <iconify-icon icon="solar:cloud-bold" className="absolute top-40 right-[15%] text-white opacity-30 text-8xl animate-float"></iconify-icon>
        </div>

        <section id="hero" className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center pt-24 pb-12 px-4">
            <div className="flex gap-4 mb-6 animate-float">
                <div className="bg-yellow-300 text-yellow-900 px-4 py-1.5 rounded-full font-extrabold text-xs tracking-wide transform -rotate-3 border-2 border-white shadow-md">
                    ✨ GENERATE LIVE
                </div>
                <div className="bg-green-300 text-green-900 px-4 py-1.5 rounded-full font-extrabold text-xs tracking-wide transform rotate-2 border-2 border-white shadow-md">
                    🎮 PLAY NOW
                </div>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight leading-none drop-shadow-xl text-outline relative group cursor-default">
                KAPOGIAN
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 mt-2 pb-4">
                    UNIVERSE
                </span>
            </h1>

            <p className="text-lg md:text-xl font-bold text-slate-500 max-w-2xl mb-10 leading-relaxed">
                The cutest Phygital experience on-chain. Collect vinyl-style NFTs,
                battle in Biringan, and farm for real yield.
            </p>

            <div ref={loadingUiRef} className="w-full max-w-md mx-auto mt-4 transition-opacity duration-500">
                <div className="glass-panel rounded-full p-1 shadow-lg">
                    <div className="relative h-3 rounded-full bg-white/60 overflow-hidden">
                        <div className="absolute inset-0 loading-bar rounded-full"></div>
                    </div>
                </div>
                <p className="mt-3 text-xs font-extrabold tracking-widest uppercase text-slate-500">
                    Loading Kapogian Universe…
                </p>
            </div>
        </section>
        
        <div className="w-full overflow-hidden leading-[0] absolute bottom-0">
            <svg
                className="relative block w-[calc(100%+1.3px)] h-[100px]"
                data-name="Layer 1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
            >
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
            </svg>
        </div>
    </div>
  );
}