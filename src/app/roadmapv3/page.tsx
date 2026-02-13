"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/kapogian/page-header";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": React.DetailedHTMLProps<
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

export default function RoadmapV3Page() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const ambientOrbRef = useRef<HTMLDivElement>(null);
  const navUiRef = useRef<HTMLDivElement>(null);
  const phaseTextRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [activeBg, setActiveBg] = useState<string | null>(null);

  const backgroundImages = [
    "/images/Roadmaps/static/phase1.png",
    "/images/Roadmaps/static/phase2.png",
    "/images/Roadmaps/static/phase3.png",
    "/images/Roadmaps/static/phase4.png",
    "/images/Roadmaps/static/phase5.webp",
  ];

  useEffect(() => {
    const container = scrollContainerRef.current;
    const bgLayer = bgLayerRef.current;
    const ambientOrb = ambientOrbRef.current;
    const navUi = navUiRef.current;
    const phaseText = phaseTextRef.current;
    const progressBar = progressBarRef.current;

    if (!container || !bgLayer || !ambientOrb || !navUi || !phaseText || !progressBar) return;

    const slides = Array.from(container.querySelectorAll(".slide-section")) as HTMLElement[];
    let currentScroll = 0;
    let targetScroll = 0;
    let maxScroll = 0;
    let activeIndex = 0;

    function resize() {
      if (container) maxScroll = container.scrollWidth - window.innerWidth;
    }
    window.addEventListener("resize", resize);
    resize();

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetScroll += e.deltaY;
      targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
    };
    window.addEventListener("wheel", handleWheel, { passive: false });

    let animationFrameId: number;
    function animate() {
      currentScroll += (targetScroll - currentScroll) * 0.08;
      if (Math.abs(targetScroll - currentScroll) < 0.1) currentScroll = targetScroll;

      if (container) container.style.transform = `translate3d(${-currentScroll}px, 0, 0)`;

      const center = currentScroll + window.innerWidth / 2;
      let newActiveIndex = 0;

      slides.forEach((slide, index) => {
        const left = slide.offsetLeft;
        const width = slide.offsetWidth;
        if (center >= left && center < left + width) newActiveIndex = index;
        
        const content = slide.querySelector(".slide-content") as HTMLElement;
        if (content) {
          const dist = center - (left + width / 2);
          if (Math.abs(dist) < window.innerWidth) {
            content.style.transform = `translateX(${dist * 0.05}px)`;
          }
        }
      });

      if (newActiveIndex !== activeIndex || currentScroll < 10) {
        activeIndex = newActiveIndex;
        updateTheme(slides[activeIndex]);
      }

      if (navUi) {
        navUi.style.opacity = activeIndex === 0 ? "0" : "1";
        navUi.style.transform = activeIndex === 0 ? "translateY(-20px)" : "translateY(0)";
      }

      const progress = maxScroll > 0 ? currentScroll / maxScroll : 0;
      if (progressBar) progressBar.style.width = `${progress * 100}%`;

      animationFrameId = requestAnimationFrame(animate);
    }

    function updateTheme(slide: HTMLElement) {
      if (!slide) return;
      const color = slide.getAttribute("data-theme");
      const newBgImage = slide.getAttribute("data-bg-image");
      const phase = slide.getAttribute("data-phase");

      setActiveBg(newBgImage);
      if (bgLayer && color) bgLayer.style.backgroundColor = color;
      if (phaseText && phase) phaseText.textContent = phase;

      const xPos = activeIndex % 3 === 0 ? "10%" : activeIndex % 2 === 0 ? "80%" : "40%";
      const yPos = activeIndex % 2 === 0 ? "-10%" : "60%";
      if (ambientOrb) {
        ambientOrb.style.left = xPos;
        ambientOrb.style.top = yPos;
      }

      slides.forEach((s) => s.classList.remove("active-slide"));
      slide.classList.add("active-slide");
    }

    document.body.style.overflow = "hidden";
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(animationFrameId);
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <>
      <style>{`
            body {
                font-family: 'Outfit', sans-serif;
                margin: 0;
                padding: 0;
                overflow: hidden;
                background-color: #1a1a1a;
                color: #1a1a1a;
                -webkit-font-smoothing: antialiased;
            }
            header {
                z-index: 1000 !important;
                position: relative;
            }
            /* Ensure all dropdown menus, popovers, and nav elements are above everything */
            header nav,
            header button,
            header [role="menu"],
            header [role="menubar"],
            header [role="navigation"],
            header .dropdown,
            header .dropdown-menu,
            header [data-radix-popper-content-wrapper],
            header [data-headlessui-state] {
                position: relative;
                z-index: 1001 !important;
            }
            /* Global dropdown portal styles (for dropdowns that render outside header) */
            [data-radix-popper-content-wrapper],
            [role="menu"],
            [role="listbox"],
            .dropdown-menu,
            [data-headlessui-portal] {
                z-index: 9999 !important;
            }
            .pogi-card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(0,0,0,0.08);
                border-radius: 24px;
                box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);
                transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                overflow: hidden; 
            }
            .active-slide .pogi-card {
                transform: scale(1.02) translateY(-5px);
            }
            .chibi-character {
                animation: breathe 4s ease-in-out infinite;
                filter: drop-shadow(0 10px 10px rgba(0,0,0,0.1));
                transform-origin: bottom center;
            }
            @keyframes breathe {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-3px) scale(1.02); }
            }
            @keyframes float-slow {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(2deg); }
            }
            .animate-float { animation: float-slow 8s ease-in-out infinite; }
            .scroll-hint-line {
                height: 60px;
                width: 1px;
                background: linear-gradient(to bottom, #000 50%, transparent 50%);
                background-size: 100% 200%;
                animation: scrollLine 2s linear infinite;
            }
            @keyframes scrollLine {
                0% { background-position: 0% 100%; }
                100% { background-position: 0% 0%; }
            }
            .slide-content {
                opacity: 0.0;
                transition: opacity 0.8s ease, transform 0.8s ease;
                transform: scale(0.95);
            }
            .active-slide .slide-content {
                opacity: 1;
                transform: scale(1);
            }
      `}</style>

      <PageHeader />
      
      <main className="relative">
        {/* BG */}
        <div ref={bgLayerRef} className="fixed inset-0 z-0 bg-[#FFFDF5]">
          <div className="absolute inset-0">
            {backgroundImages.map((src) => (
              <Image key={src} src={src} alt="bg" fill className={`object-cover transition-opacity duration-1000 ${activeBg === src ? "opacity-100" : "opacity-0"}`} priority={activeBg === src} />
            ))}
          </div>
          <div ref={ambientOrbRef} className="absolute w-[600px] h-[600px] rounded-full bg-white opacity-20 blur-[100px] transition-all duration-1000"></div>
        </div>

        {/* HUD */}
        <div ref={navUiRef} className="fixed bottom-0 left-0 w-full z-50 px-8 py-10 flex justify-end items-start transition-all duration-500 opacity-0 -translate-y-4">
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md border border-black/5 px-4 py-2 rounded-full shadow-sm">
            <span ref={phaseTextRef} className="text-xs font-semibold uppercase tracking-wider text-slate-500 w-24 text-right">Intro</span>
            <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div ref={progressBarRef} className="h-full bg-black w-0 transition-all duration-300"></div>
            </div>
          </div>
        </div>

        {/* TRACK */}
        <div ref={scrollContainerRef} className="fixed top-0 left-0 h-full flex items-center will-change-transform z-10">
          
          {/* 0. INTRO */}
          <section className="slide-section w-screen h-screen flex-shrink-0 flex flex-col items-center justify-center px-6" data-theme="#FFFDF5" data-phase="START">
            <div className="slide-content flex flex-col items-center text-center pt-20">
              <div className="mb-8 relative">
                <div className="absolute inset-0 bg-yellow-300 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                <iconify-icon icon="solar:star-circle-linear" width="80" class="text-slate-900 relative z-10 animate-float"></iconify-icon>
              </div>
              <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter text-slate-900 leading-[0.9] mb-6">Kapogian</h1>
              <div className="h-px w-24 bg-slate-300 mb-6"></div>
              <p className="text-xl md:text-2xl font-medium text-slate-500 tracking-tight mb-2 max-w-xl">Master Roadmap 2026 to 2027</p>
              <p className="text-sm text-slate-400 font-medium uppercase tracking-widest mb-12">Multi-Dimensional Growth Strategy</p>
              <div className="flex flex-col items-center gap-3 opacity-60">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Scroll to Begin</span>
                <div className="scroll-hint-line bg-slate-900"></div>
              </div>
            </div>
          </section>

          {/* 1. GENESIS */}
          <section className="slide-section w-[90vw] md:w-[600px] h-screen flex-shrink-0 flex items-center justify-center px-4 md:px-12" data-phase="PHASE 1" data-bg-image="/images/Roadmaps/static/phase1.png">
            <div className="slide-content w-full h-full max-h-[580px] pt-28 md:pt-24">
              <div className="pogi-card p-8 md:p-10 h-full flex flex-col relative group">
                <iconify-icon
                  icon="solar:structure-linear"
                  class="absolute -right-8 -top-8 text-emerald-100 opacity-50 group-hover:rotate-12 transition-transform duration-700"
                  width="200"
                ></iconify-icon>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">Q1 2026</span>
                    <iconify-icon icon="solar:sledgehammer-linear" width="24" class="text-emerald-600"></iconify-icon>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-2">Genesis</h2>
                  <p className="text-emerald-700/80 font-medium text-lg mb-8">Foundation & Infrastructure</p>
                  <div className="space-y-5">
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5"><iconify-icon icon="solar:paint-palette-linear" class="text-white" width="14"></iconify-icon></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm md:text-base">Art & Brand Finalization</h4><p className="text-xs md:text-sm text-slate-500 leading-relaxed mt-1">High-fashion pixel art for 10,000 Spirit NFT traits.</p></div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5"><iconify-icon icon="solar:shield-check-linear" class="text-white" width="14"></iconify-icon></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm md:text-base">Smart Contract Audits</h4><p className="text-xs md:text-sm text-slate-500 leading-relaxed mt-1">Security-first Sui Move contracts for staking/locking.</p></div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5"><iconify-icon icon="solar:users-group-two-rounded-linear" class="text-white" width="14"></iconify-icon></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm md:text-base">Community Cultivation</h4><p className="text-xs md:text-sm text-slate-500 leading-relaxed mt-1">"Pogi Nation" launch & whitelist campaigns.</p></div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-5 -right-5 w-40 h-40 z-20"><Image src="/images/Roadmaps/chibi-character/phase1.gif" alt="c1" width={160} height={160} className="w-full h-full object-contain chibi-character" unoptimized /></div>
              </div>
            </div>
          </section>

          {/* 2. IDENTITY */}
          <section className="slide-section w-[90vw] md:w-[600px] h-screen flex-shrink-0 flex items-center justify-center px-4 md:px-12" data-phase="PHASE 2" data-bg-image="/images/Roadmaps/static/phase2.png">
            <div className="slide-content w-full h-full max-h-[580px] pt-28 md:pt-24">
              <div className="pogi-card p-8 md:p-10 h-full flex flex-col relative group">
                <iconify-icon
                  icon="solar:user-id-linear"
                  class="absolute -left-8 -top-8 text-cyan-100 opacity-50"
                  width="200"
                ></iconify-icon>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="px-3 py-1 rounded-md bg-cyan-100 text-cyan-800 text-xs font-semibold">Q1-Q2 2026</span>
                    <iconify-icon icon="solar:glasses-linear" width="24" class="text-cyan-600"></iconify-icon>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-2">Identity</h2>
                  <p className="text-cyan-700/80 font-medium text-lg mb-8">Digital Ownership Meets Reality</p>
                  <div className="space-y-5">
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5"><iconify-icon icon="solar:ticket-linear" class="text-white" width="14"></iconify-icon></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm">Genesis Mint</h4><p className="text-xs text-slate-500 mt-1">Official launch of Kapogian Spirit NFT collection.</p></div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5"><iconify-icon icon="solar:shop-linear" class="text-white" width="14"></iconify-icon></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm">Pogi Storefront</h4><p className="text-xs text-slate-500 mt-1">Verify NFT to order 1-to-1 unique apparel & plates.</p></div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5"><iconify-icon icon="solar:box-minimalistic-linear" class="text-white" width="14"></iconify-icon></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm">Global Logistics</h4><p className="text-xs text-slate-500 mt-1">Partnerships for "Proof of Pogi" fulfillment.</p></div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-2 w-40 h-40 z-20"><Image src="/images/Roadmaps/chibi-character/phase2.gif" alt="c2" width={160} height={160} className="w-full h-full object-contain chibi-character" unoptimized /></div>
              </div>
            </div>
          </section>

          {/* 3. CONQUEST */}
          <section className="slide-section w-[90vw] md:w-[600px] h-screen flex-shrink-0 flex items-center justify-center px-4 md:px-12" data-phase="PHASE 3" data-bg-image="/images/Roadmaps/static/phase3.png">
            <div className="slide-content w-full h-full max-h-[580px] pt-28 md:pt-24">
              <div className="pogi-card p-8 md:p-10 h-full flex flex-col relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-purple-50 opacity-50"></div>
                <iconify-icon
                  icon="solar:gamepad-linear"
                  class="absolute -right-8 -top-8 text-purple-100 opacity-60"
                  width="200"
                ></iconify-icon>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="px-3 py-1 rounded-md bg-purple-100 text-purple-800 text-xs font-semibold">Q2-Q3 2026</span>
                    <iconify-icon icon="solar:ghost-linear" width="24" class="text-purple-600"></iconify-icon>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-2">Conquest</h2>
                  <p className="text-purple-700/80 font-medium text-lg mb-8">Biringan City High-Stakes Gaming</p>
                  <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold text-white">3A</span></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm">Wilderness Prototype</h4><p className="text-xs text-slate-500 mt-1">Core mechanics in Construct 3, "Social Anxiety" shader, and Samar Threshold alpha.</p></div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold text-white">3B</span></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm">Bugkot Integration</h4><p className="text-xs text-slate-500 mt-1">Asset locking, "Permadeath Burn" logic, and The Graveyard Hall of Fame.</p></div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold text-white">3C</span></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm">Obsidian Core (Beta)</h4><p className="text-xs text-slate-500 mt-1">50 levels, Boss AI, and NFT stats-based adaptive MMR scaling.</p></div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 z-20"><Image src="/images/Roadmaps/chibi-character/phase3.gif" alt="c3" width={192} height={192} className="w-full h-full object-contain chibi-character" unoptimized /></div>
              </div>
            </div>
          </section>

          {/* 4. THE FARM */}
          <section className="slide-section w-[90vw] md:w-[600px] h-screen flex-shrink-0 flex items-center justify-center px-4 md:px-12" data-phase="PHASE 4" data-bg-image="/images/Roadmaps/static/phase4.png">
            <div className="slide-content w-full h-full max-h-[580px] pt-28 md:pt-24">
              <div className="pogi-card p-8 md:p-10 h-full flex flex-col relative group">
                <iconify-icon
                  icon="solar:sun-2-linear"
                  class="absolute -top-8 -left-8 text-orange-100 opacity-60"
                  width="200"
                ></iconify-icon>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="px-3 py-1 rounded-md bg-orange-100 text-orange-800 text-xs font-semibold">Q3-Q4 2026</span>
                    <iconify-icon icon="solar:smart-home-angle-linear" width="24" class="text-orange-600"></iconify-icon>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-2">The Farm</h2>
                  <p className="text-orange-700/80 font-medium text-lg mb-8">Phygital RWA Agriculture</p>
                  <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold text-white">4A</span></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm">The Barn (Smart Contracts)</h4><p className="text-xs text-slate-500 mt-1">NFT reminting engine, investment halving algorithm, and automated payouts.</p></div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold text-white">4B</span></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm">The Pilot Farm</h4><p className="text-xs text-slate-500 mt-1">Mapandan, Philippines. RFID tags, IoT sensors, and farmer admin app.</p></div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold text-white">4C</span></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm">The Daily Report Loop</h4><p className="text-xs text-slate-500 mt-1">Stardew-inspired dashboard with real-time livestock tracking (Pigs/Goats).</p></div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-40 h-40 z-20"><Image src="/images/Roadmaps/chibi-character/phase4.gif" alt="c4" width={160} height={160} className="w-full h-full object-contain chibi-character" unoptimized /></div>
              </div>
            </div>
          </section>

          {/* 5. EXPANSION */}
          <section className="slide-section w-[90vw] md:w-[600px] h-screen flex-shrink-0 flex items-center justify-center px-4 md:px-12" data-phase="PHASE 5" data-bg-image="/images/Roadmaps/static/phase5.webp">
            <div className="slide-content w-full h-full max-h-[580px] pt-28 md:pt-24">
              <div className="pogi-card p-8 md:p-10 h-full flex flex-col relative group">
                <iconify-icon
                  icon="solar:bolt-linear"
                  class="absolute -top-8 -right-8 text-yellow-100 opacity-80"
                  width="200"
                ></iconify-icon>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="px-3 py-1 rounded-md bg-yellow-100 text-yellow-800 text-xs font-semibold">Q3 2027</span>
                    <iconify-icon icon="solar:globus-linear" width="24" class="text-yellow-600"></iconify-icon>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-2">Expansion</h2>
                  <p className="text-yellow-700/80 font-medium text-lg mb-8">Interoperability & Scaling</p>
                  <div className="space-y-5">
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5"><iconify-icon icon="solar:transfer-horizontal-linear" class="text-white" width="14"></iconify-icon></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm">Cross-Game Traits</h4><p className="text-xs text-slate-500 mt-1">Soulbound Badges from Biringan provide boosts/discounts in Farm.</p></div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5"><iconify-icon icon="solar:shop-2-linear" class="text-white" width="14"></iconify-icon></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm">Trading Post</h4><p className="text-xs text-slate-500 mt-1">Secondary market for high-level assets and matured livestock yields.</p></div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5"><iconify-icon icon="solar:leaf-linear" class="text-white" width="14"></iconify-icon></div>
                      <div><h4 className="font-semibold text-slate-900 text-sm">Global Biomes</h4><p className="text-xs text-slate-500 mt-1">Coffee/Cacao expansion based on community governance data.</p></div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-5 -right-5 w-40 h-40 z-20"><Image src="/images/Roadmaps/chibi-character/phase5.gif" alt="c5" width={160} height={160} className="w-full h-full object-contain chibi-character" unoptimized /></div>
              </div>
            </div>
          </section>

          {/* 6. $POGI TOKEN */}
          <section className="slide-section w-[90vw] md:w-[600px] h-screen flex-shrink-0 flex items-center justify-center px-4 md:px-12" data-phase="PHASE 6" data-bg-image="/images/Roadmaps/static/phase1.png">
            <div className="slide-content w-full h-full max-h-[580px] pt-28 md:pt-24">
              <div className="pogi-card p-8 md:p-10 h-full flex flex-col relative border-pink-200 bg-gradient-to-b from-white to-pink-50">
                <div className="absolute inset-0 flex items-center justify-center opacity-5">
                  <iconify-icon icon="solar:crown-linear" width="400"></iconify-icon>
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6">
                    <span className="px-3 py-1 rounded-md bg-pink-100 text-pink-800 text-xs font-semibold">End 2027</span>
                    <iconify-icon icon="solar:star-fall-linear" width="24" class="text-pink-600"></iconify-icon>
                  </div>
                  <h2 className="text-5xl md:text-6xl font-semibold tracking-tighter mb-2 text-pink-950">$POGI</h2>
                  <p className="text-pink-800 font-medium text-lg mb-8">The Ultimate Economic Engine</p>

                  <ul className="space-y-4 mb-auto">
                    <li className="flex items-center gap-3 text-pink-900 font-medium text-sm">
                      <iconify-icon icon="solar:rocket-2-linear" class="text-pink-600 text-xl"></iconify-icon>
                      Token TGE & Liquidity Injection on Sui
                    </li>
                    <li className="flex items-center gap-3 text-pink-900 font-medium text-sm">
                      <iconify-icon icon="solar:card-recieved-linear" class="text-pink-600 text-xl"></iconify-icon>
                      Full Ecosystem Fee Integration
                    </li>
                    <li className="flex items-center gap-3 text-pink-900 font-medium text-sm">
                      <iconify-icon icon="solar:users-group-rounded-linear" class="text-pink-600 text-xl"></iconify-icon>
                      The Pogi Council (DAO) Governance
                    </li>
                  </ul>
                  <button 
                    onClick={() => {
                      window.location.href = '/whitepaper';
                    }}
                    className="w-full py-4 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 mt-6 relative z-30"
                  >
                    Read Whitepaper
                  </button>
                </div>

                <div className="absolute -bottom-2 -right-4 w-36 h-36 z-20">
                  <Image src="/images/Roadmaps/chibi-character/pogi.gif" alt="c6" width={160} height={160} className="w-full h-full object-contain chibi-character" unoptimized />
                </div>
              </div>
            </div>
          </section>

          {/* 7. LEGACY */}
          <section className="slide-section w-screen h-screen flex-shrink-0 flex items-center justify-center" data-phase="FUTURE" data-bg-image="/images/Roadmaps/static/phase5.webp">
            <div className="slide-content text-center pt-20">
              <h2 className="text-6xl font-bold tracking-tight text-white drop-shadow-lg">Beyond 2027</h2>
              <p className="text-white/80 mt-4 text-lg mb-8">The Evolution of Pogi Nation Continues.</p>
              <button 
                onClick={() => {
                  // TODO: Add community page route here
                  window.location.href = '#';
                }}
                className="px-8 py-4 bg-white text-slate-900 font-semibold text-lg rounded-full hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                Join the Community
              </button>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}