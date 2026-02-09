'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import Link from 'next/link';
import { PageHeader } from '@/components/kapogian/page-header';
import { PageFooter } from '@/components/kapogian/page-footer';

// I have to define IconifyIcon for typescript since it's not a standard element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        icon: string;
        width?: string;
        class?: string;
      };
    }
  }
}

export default function RoadmapV2Page() {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const mainCharRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const uiState = { lastScrollY: 0, ticking: false };
        const elements = {
            wrapper: wrapperRef.current,
            track: trackRef.current,
            mainChar: mainCharRef.current,
        };

        if (!elements.wrapper || !elements.track || !elements.mainChar) {
            return;
        }

        const update = () => {
            const scrollY = window.scrollY;
            const wrapperTop = elements.wrapper!.offsetTop;
            const wrapperHeight = elements.wrapper!.offsetHeight;
            const viewportHeight = window.innerHeight;

            const startScroll = wrapperTop;
            const endScroll = wrapperTop + wrapperHeight - viewportHeight;

            if (scrollY >= startScroll && scrollY <= endScroll) {
                const progress = (scrollY - startScroll) / (endScroll - startScroll);
                const trackWidth = elements.track!.scrollWidth;
                const viewportWidth = window.innerWidth;
                const maxTranslate = trackWidth - viewportWidth;

                elements.track!.style.transform = `translate3d(-${progress * maxTranslate}px, 0, 0)`;

                const velocity = scrollY - uiState.lastScrollY;
                const tilt = Math.min(Math.max(velocity * 0.1, -10), 10);

                elements.mainChar!.style.transform = `translate3d(0, -50%, 0) rotate(${tilt}deg)`;
            } else if (scrollY < startScroll) {
                elements.track!.style.transform = `translate3d(0, 0, 0)`;
            } else {
                const trackWidth = elements.track!.scrollWidth;
                const viewportWidth = window.innerWidth;
                elements.track!.style.transform = `translate3d(-${trackWidth - viewportWidth}px, 0, 0)`;
            }

            uiState.lastScrollY = scrollY;
            uiState.ticking = false;
        };

        const onScroll = () => {
            if (!uiState.ticking) {
                window.requestAnimationFrame(update);
                uiState.ticking = true;
            }
        };

        window.addEventListener("scroll", onScroll);

        const toyCards = document.querySelectorAll(".toy-card");
        const handleMouseMove = (e: MouseEvent) => {
            const card = e.currentTarget as HTMLElement;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xPct = x / rect.width - 0.5;
            const yPct = y / rect.height - 0.5;
            card.style.transform = `perspective(1000px) rotateX(${yPct * -4}deg) rotateY(${xPct * 4}deg) scale(1.02) translateY(-8px)`;
        };

        const handleMouseLeave = (e: MouseEvent) => {
            const card = e.currentTarget as HTMLElement;
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1) translateY(0)`;
        };

        toyCards.forEach((card) => {
            card.addEventListener("mousemove", handleMouseMove as EventListener);
            card.addEventListener("mouseleave", handleMouseLeave as EventListener);
        });

        update();

        return () => {
            window.removeEventListener("scroll", onScroll);
            toyCards.forEach((card) => {
                card.removeEventListener("mousemove", handleMouseMove as EventListener);
                card.removeEventListener("mouseleave", handleMouseLeave as EventListener);
            });
        };
    }, []);


  return (
    <>
        <Script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js" strategy="lazyOnload" />
        
        <div className="relative selection:bg-sky-300 selection:text-sky-900 font-body bg-sky-100 text-slate-800">
            {/* Sky Background Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-100 to-white"></div>
                <div className="absolute top-[10%] left-[5%] text-white/40 animate-cloud" style={{ animationDelay: '0s' }}>
                    <iconify-icon icon="solar:cloud-bold" width="120"></iconify-icon>
                </div>
                <div className="absolute top-[25%] right-[10%] text-white/60 animate-cloud" style={{ animationDelay: '-5s' }}>
                    <iconify-icon icon="solar:cloud-bold" width="180"></iconify-icon>
                </div>
                <div className="absolute top-[60%] left-[15%] text-sky-50 animate-cloud" style={{ animationDelay: '-10s' }}>
                    <iconify-icon icon="solar:cloud-bold" width="240"></iconify-icon>
                </div>
                <div className="absolute bottom-[10%] right-[20%] text-white/30 animate-cloud" style={{ animationDelay: '-2s' }}>
                    <iconify-icon icon="solar:cloud-bold" width="150"></iconify-icon>
                </div>
            </div>

            <PageHeader/>

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-center text-center pt-24 pb-32 px-4 z-10">
                <div className="mb-6 animate-float-medium">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-sky-100 text-sky-600 text-xs font-extrabold uppercase tracking-wider shadow-lg">
                        <iconify-icon icon="solar:stars-bold" className="text-yellow-400 text-lg"></iconify-icon>
                        Minting Facility Open
                    </span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black text-slate-800 tracking-tight leading-[1] mb-6 drop-shadow-sm max-w-5xl mx-auto relative font-headline">
                    <span className="relative z-10 text-outline-white">Build the</span> <br />
                    <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 gradient-text relative z-10">
                        Winter Future
                    </span>
                    <iconify-icon icon="solar:star-bold" className="absolute -top-10 -right-4 text-yellow-300 text-6xl animate-pulse z-0 hidden md:block"></iconify-icon>
                </h1>
                <p className="text-lg md:text-2xl text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed font-semibold">
                    Welcome to the Kapogian Facility. From icy logic to frosty visuals, watch your digital collectibles come to life.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Link href="/generate" passHref>
                        <button className="h-16 px-10 rounded-full bg-sky-500 text-white font-bold text-lg hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/30 hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center gap-3 group border-b-4 border-sky-700">
                            Generate Kapogian
                            <iconify-icon icon="solar:play-circle-bold" className="text-2xl text-pink-500"></iconify-icon>
                        </button>
                    </Link>
                </div>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-sky-800/50">Scroll Down</span>
                        <iconify-icon icon="solar:mouse-circle-linear" className="text-sky-800/40 text-3xl"></iconify-icon>
                    </div>
                </div>
            </section>
            
            {/* HORIZONTAL SCROLL ROADMAP */}
            <div id="roadmap-wrapper" ref={wrapperRef} className="relative h-[500vh] z-20">
                <div className="sticky top-0 h-screen w-full overflow-hidden">
                    <div className="absolute top-1/2 left-0 w-full h-8 bg-sky-100/50 border-y-2 border-white -translate-y-1/2 z-0 backdrop-blur-sm"></div>
                    <div id="main-character" ref={mainCharRef} className="absolute left-6 md:left-20 top-1/2 -translate-y-1/2 z-50 group cursor-pointer transition-transform duration-100 ease-linear will-change-transform">
                    <Image src="/images/skydiving.gif" width={100} height={100} className="w-full h-full object-cover opacity-100 w-full" alt="User Avatar" />                            </div>

                    <div id="roadmap-track" ref={trackRef} className="absolute top-0 left-0 h-full flex items-center pl-[60vw] pr-[50vw] gap-[20vw] md:gap-[25vw] will-change-transform">
                       
                        {/* STEP 1 */}
                        <div className="relative w-[85vw] md:w-[32rem] flex-shrink-0">
                            <div className="toy-card rounded-[2.5rem] p-8 h-[28rem] relative flex flex-col">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center border-2 border-white shadow-sm">
                                        <iconify-icon icon="solar:code-square-bold" className="text-3xl text-pink-500"></iconify-icon>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-black text-pink-400 uppercase tracking-wider">Day 01</span>
                                        <h3 className="text-3xl font-black text-slate-800 tracking-tight font-headline">Logic & Generation</h3>
                                    </div>
                                </div>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6 z-10 relative">
                                    Port Kapogian Gemini Logic, setup Pinata storage, and generate encrypted treasury keypair.
                                </p>
                                <div className="bg-slate-800 rounded-xl p-4 mb-6 relative overflow-hidden shadow-inner border border-slate-700">
                                    <div className="font-mono text-[10px] text-green-400 leading-relaxed opacity-80">
                                        <div className="overflow-hidden whitespace-nowrap animate-[code-type_2s_steps(20)_infinite]">Port Gemini Logic</div>
                                        <div className="overflow-hidden whitespace-nowrap animate-[code-type_2s_steps(20)_infinite_0.5s]" style={{ width: '0' }}>Pinata Setup</div>
                                        <div className="overflow-hidden whitespace-nowrap animate-[code-type_2s_steps(20)_infinite_1s]" style={{ width: '0' }}>Treasury Keypair Encryption</div>
                                    </div>
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-48 h-48 z-20 pointer-events-none">
                                    <Image src="images/day1.gif" width={200} height={200} className="w-full h-full object-contain drop-shadow-xl" alt="day 1 Character" />
                                </div>
                            </div>
                        </div>

                        {/* STEP 2 */}
                         <div className="relative w-[85vw] md:w-[32rem] flex-shrink-0">
                            <div className="toy-card rounded-[2.5rem] p-8 h-[28rem] relative flex flex-col">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center border-2 border-white shadow-sm">
                                  <iconify-icon icon="solar:document-add-bold" className="text-3xl text-yellow-500"></iconify-icon>
                                </div>
                                <div>
                                  <span className="block text-xs font-black text-yellow-400 uppercase tracking-wider">Day 02</span>
                                  <h3 className="text-3xl font-black text-slate-800 tracking-tight font-headline">Smart Contract Build</h3>
                                </div>
                              </div>
                              <p className="text-slate-500 font-medium leading-relaxed mb-6 z-10 relative max-w-[70%]">
                                Develop Kapogian NFT Display Contract and Soulbound Receipt Contract then deploy to SUI testnet.
                              </p>
                              <div className="flex gap-3 z-10 relative">
                                <div className="bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200 text-yellow-700 font-bold text-xs flex items-center gap-2">
                                  <iconify-icon icon="solar:check-circle-bold"></iconify-icon>
                                  NFT Display Contract
                                </div>
                                <div className="bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200 text-yellow-700 font-bold text-xs flex items-center gap-2">
                                  <iconify-icon icon="solar:check-circle-bold"></iconify-icon>
                                  SBT Receipt Contract
                                </div>
                                <div className="bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200 text-yellow-700 font-bold text-xs flex items-center gap-2">
                                  <iconify-icon icon="solar:check-circle-bold"></iconify-icon>
                                  Testnet Deployment
                                </div>
                              </div>
                              <div className="absolute -bottom-2 -right-4 w-56 h-56 z-20 pointer-events-none">
                                <Image src="images/day2.gif" width={220} height={220} className="w-full h-full object-contain drop-shadow-xl" alt="Day 2 Character" />
                              </div>
                            </div>
                        </div>

                        {/* STEP 3 */}
                         <div className="relative w-[85vw] md:w-[32rem] flex-shrink-0">
                            <div className="toy-card rounded-[2.5rem] p-8 h-[28rem] relative flex flex-col">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center border-2 border-white shadow-sm">
                                  <iconify-icon icon="solar:palette-bold" className="text-3xl text-purple-500"></iconify-icon>
                                </div>
                                <div>
                                  <span className="block text-xs font-black text-purple-400 uppercase tracking-wider">Day 03</span>
                                  <h3 className="text-3xl font-black text-slate-800 tracking-tight font-headline">Frontend Mint UI</h3>
                                </div>
                              </div>
                              <p className="text-slate-500 font-medium leading-relaxed mb-6 z-10 relative max-w-[65%]">
                                Build Pudgy-style Next.js interface including mint flow and merchandise selection system.
                              </p>
                              <div className="flex gap-2 z-10 relative mb-4">
                                <div className="w-8 h-8 rounded-full bg-sky-400 border-2 border-white shadow-md"></div>
                                <div className="w-8 h-8 rounded-full bg-red-400 border-2 border-white shadow-md"></div>
                                <div className="w-8 h-8 rounded-full bg-lime-400 border-2 border-white shadow-md"></div>
                                <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-md"></div>
                              </div>
                              <div className="absolute -bottom-4 -right-4 w-52 h-52 z-20 pointer-events-none">
                                <Image src="images/day3.gif" width={220} height={220} className="w-full h-full object-contain drop-shadow-xl" alt="day 3 Character" />
                              </div>
                            </div>
                        </div>

                        {/* STEP 4 */}
                        <div className="relative w-[85vw] md:w-[32rem] flex-shrink-0">
                            <div className="toy-card rounded-[2.5rem] p-8 h-[28rem] relative flex flex-col">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center border-2 border-white shadow-sm">
                                  <iconify-icon icon="solar:shield-check-bold" className="text-3xl text-emerald-500"></iconify-icon>
                                </div>
                                <div>
                                  <span className="block text-xs font-black text-emerald-400 uppercase tracking-wider">Day 04</span>
                                  <h3 className="text-3xl font-black text-slate-800 tracking-tight font-headline">Privacy & Security</h3>
                                </div>
                              </div>
                              <p className="text-slate-500 font-medium leading-relaxed mb-6 z-10 relative max-w-[60%]">
                                Implement client-side encryption and create admin dashboard with secure decryption workflow.
                              </p>
                              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 z-10 relative w-fit">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                  Client Encryption
                                </div>
                              </div>
                              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 z-10 relative w-fit mt-2">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                  Admin Dashboard
                                </div>
                              </div>
                              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 z-10 relative w-fit mt-2">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                  Secure Data Flow
                                </div>
                              </div>
                              <div className="absolute -bottom-2 -right-2 w-56 h-56 z-20 pointer-events-none">
                                <Image src="images/day4.gif" width={240} height={240} className="w-full h-full object-contain drop-shadow-xl" alt="Day 4 Character" />
                              </div>
                            </div>
                        </div>
                        
                        {/* STEP 5 */}
                        <div className="relative w-[85vw] md:w-[32rem] flex-shrink-0">
                            <div className="toy-card rounded-[2.5rem] p-1 h-[28rem] relative flex flex-col !bg-gradient-to-br !from-sky-400 !to-blue-500 !border-sky-300">
                              <div className="w-full h-full bg-white/10 rounded-[2.3rem] p-8 relative overflow-hidden">
                                <div className="absolute top-4 left-10 w-2 h-2 bg-white rounded-full opacity-60"></div>
                                <div className="absolute top-20 right-20 w-3 h-3 bg-white rounded-full opacity-40"></div>
                                <div className="flex items-center gap-4 mb-4 relative z-10">
                                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 shadow-sm">
                                    <iconify-icon icon="solar:rocket-bold" className="text-3xl text-white"></iconify-icon>
                                  </div>
                                  <div>
                                    <span className="block text-xs font-black text-sky-100 uppercase tracking-wider">Day 05</span>
                                    <h3 className="text-3xl font-black text-white tracking-tight font-headline">Mainnet Launch</h3>
                                  </div>
                                </div>
                                <p className="text-sky-50 font-medium leading-relaxed mb-8 z-10 relative max-w-[60%]">
                                  Deploy Kapogian to SUI mainnet, verify Tradeport listing, and confirm treasury wallet connection.
                                </p>
                                <button className="w-2/3 py-3 bg-white text-blue-600 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 relative z-10">
                                  Start Minting
                                  <iconify-icon icon="solar:arrow-right-bold"></iconify-icon>
                                </button>
                                <div className="absolute -bottom-4 -right-4 w-60 h-60 z-20 pointer-events-none">
                                  <Image src="images/day5.gif" width={250} height={250} className="w-full h-full object-contain drop-shadow-xl" alt="Day 5 Character" />
                                </div>
                              </div>
                            </div>
                        </div>

                        <div className="w-10"></div>
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <section className="relative bg-white py-24 px-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-pink-200 via-blue-200 to-green-200"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <iconify-icon icon="solar:confetti-minimalistic-bold" className="absolute top-0 left-10 text-yellow-400 animate-float" width="48"></iconify-icon>
                    <iconify-icon icon="solar:confetti-minimalistic-bold" className="absolute top-10 right-20 text-pink-400" width="56"></iconify-icon>
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-8 bg-white rounded-[2rem] shadow-xl transform rotate-3">
                        <iconify-icon icon="solar:crown-star-bold" className="text-5xl text-yellow-400"></iconify-icon>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-extrabold text-slate-800 tracking-tight mb-8 font-headline">
                        Ready to Collect?
                    </h2>
                    <div className="mx-auto w-48 h-48 md:w-64 md:h-64 char-container rounded-full border-8 border-yellow-200 shadow-2xl mb-10 flex items-center justify-center placeholder-dashed relative overflow-hidden group">
                        <div className="absolute inset-0 bg-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Image src="images/celebrate.gif" width={200} height={200} className="w-full h-full object-contain drop-shadow-xl" alt="day 1 Character" />
                    </div>
                    <Link href="/generate" passHref>
                        <button className="bg-slate-800 hover:bg-slate-700 text-white text-xl font-bold py-5 px-12 rounded-[2rem] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-4 border-slate-600">
                          Summon Kapogian Spirit
                        </button>
                    </Link>
                    <p className="mt-6 text-slate-400 font-semibold text-sm">
                        Secure • Playful • Community Driven
                    </p>
                </div>
            </section>
            
            <PageFooter />
        </div>
    </>
  );
}
