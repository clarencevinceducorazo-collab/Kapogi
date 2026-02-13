"use client";

import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import Image from "next/image";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function WhitepaperPage() {
  return (
    <>
      <PageHeader />
      
      {/* --- BACKGROUND SECTIONS REINSTATED --- */}
      <div className="fixed inset-0 -z-10">
        <div className="hidden md:block relative w-full h-full">
          <Image
            src="/images/kapogian_portrait_optimized.png"
            alt="Whitepaper background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="block md:hidden relative w-full h-full">
          <Image
            src="/images/kapogian_background.png"
            alt="Whitepaper background mobile"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="relative pt-32 pb-24 px-4 min-h-screen antialiased">
        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* HEADER CARD */}
          <motion.div 
            {...fadeInUp}
            className="bg-yellow-300 comic-border-thick p-8 rounded-3xl toy-shadow-lg"
          >
            <h1 className="font-headline text-4xl md:text-5xl tracking-wide text-black">
              The Pogi Protocol
            </h1>
            <p className="font-bold text-black/60 uppercase text-sm">
              Kapogian Coin ($KPG) Whitepaper v2.2
            </p>
          </motion.div>

          {/* CONTENT SECTIONS with Glass-morphism to prevent "clutter" over image */}
          <div className="space-y-8">
            
            {/* 1. EXECUTIVE SUMMARY */}
            <motion.section 
              {...fadeInUp}
              className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-3xl comic-border-thick toy-shadow-sm"
            >
              <h2 className="font-headline text-3xl mb-6 text-blue-600">1. Executive Summary</h2>
              <div className="space-y-4 text-slate-800 leading-relaxed">
                <p>
                  In an era of hyper-curated social media and unrealistic standards,
                  the modern man often finds himself in a <strong>"Confidence Deficit."</strong>
                  Kapogian Coin ($KPG) is a decentralized initiative built on the
                  SUI blockchain designed to bridge the gap between digital identity
                  and self-worth.
                </p>
                <p>
                  Unlike traditional meme coins that prioritize immediate liquidity
                  over substance, $KPG follows a <strong>"Value-First"</strong> trajectory. We are
                  building a four-year roadmap centered on high-end physical
                  collectibles, strategic gaming, and a narrative that celebrates
                  the "Pogi" nature in every man.
                </p>
              </div>
            </motion.section>

            {/* 2. THE PHILOSOPHY */}
            <motion.section 
              {...fadeInUp}
              className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-3xl comic-border-thick"
            >
              <h2 className="font-headline text-3xl mb-6 text-blue-600">2. Philosophy of "Pogi"</h2>
              <p className="mb-6">The word "Pogi" is more than just a physical description; it is a state of mind.</p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-xl border-2 border-black/10">
                  <h3 className="font-bold mb-1">Diskarte</h3>
                  <p className="text-sm text-slate-500">The ability to navigate life with wit.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border-2 border-black/10">
                  <h3 className="font-bold mb-1">Confidence</h3>
                  <p className="text-sm text-slate-500">The audacity to be oneself without apology.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border-2 border-black/10">
                  <h3 className="font-bold mb-1">Style</h3>
                  <p className="text-sm text-slate-500">The unique flair that makes you stand out.</p>
                </div>
              </div>
              <p className="mt-8 font-bold text-center italic">"Everyone is good-looking in their own way."</p>
            </motion.section>

            {/* 3. PHASE I & MERCH */}
            <motion.section 
              {...fadeInUp}
              className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-3xl comic-border-thick"
            >
              <h2 className="font-headline text-3xl mb-6 text-blue-600">3. Phase I: The Bridge (2026-2027)</h2>
              <p className="mb-8 italic">Focus: Establishing the brand through the Kapogian NFT Collection.</p>
              
              <div className="space-y-6">
                <div className="border-l-4 border-yellow-400 pl-4">
                  <h3 className="font-bold text-xl mb-2">3.1 The "Phygital" Experience</h3>
                  <p className="text-sm text-slate-600">
                    Every NFT grants the exclusive right to purchase its physical counterpart—a design never replicated for anyone else.
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 pt-4">
                  <button className="bg-white border-2 border-black p-4 rounded-xl hover:-translate-y-1 transition-transform text-center active:scale-95">
                    <p className="font-bold text-xs uppercase">Signature Apparel</p>
                    <p className="text-[10px] text-slate-400">T-shirts & Hoodies</p>
                  </button>
                  <button className="bg-white border-2 border-black p-4 rounded-xl hover:-translate-y-1 transition-transform text-center active:scale-95">
                    <p className="font-bold text-xs uppercase">The Pogi Vessel</p>
                    <p className="text-[10px] text-slate-400">Custom Mugs</p>
                  </button>
                  <button className="bg-white border-2 border-black p-4 rounded-xl hover:-translate-y-1 transition-transform text-center active:scale-95">
                    <p className="font-bold text-xs uppercase">Artifacts</p>
                    <p className="text-[10px] text-slate-400">Aluminum Plates</p>
                  </button>
                </div>
              </div>
            </motion.section>

            {/* 4. PHASE II: THE GAME */}
            <motion.section 
              {...fadeInUp}
              className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-3xl comic-border-thick"
            >
              <h2 className="font-headline text-3xl mb-6 text-blue-600">4. Phase II: Card Game (2027)</h2>
              <p className="mb-6">The Kapogian Card Game (KCG) is a strategic tabletop-style digital game where your NFT is a deck commander.</p>
              <div className="bg-slate-900 text-white p-6 rounded-2xl">
                <h4 className="text-yellow-400 font-bold mb-4 uppercase text-xs tracking-widest">Aura-Based MMR Innovation:</h4>
                <ul className="grid sm:grid-cols-3 gap-4 text-xs">
                  <li><span className="block font-bold">Jawline</span> Influences Defense</li>
                  <li><span className="block font-bold">Swagger</span> Affects Draw Speed</li>
                  <li><span className="block font-bold">Charisma</span> Enhances Specials</li>
                </ul>
              </div>
            </motion.section>

            {/* 5 & 6. TOKENOMICS & SUI */}
            <motion.section 
              {...fadeInUp}
              className="bg-black text-white p-8 md:p-12 rounded-3xl comic-border-thick"
            >
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h2 className="font-headline text-3xl mb-6 text-yellow-400">5. $KPG Token</h2>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Supply:</strong> 1,000,000,000</li>
                    <li><strong>Chain:</strong> SUI Network</li>
                    <li><strong>Utility:</strong> Tournaments, Refinement, & Store Discounts</li>
                  </ul>
                </div>
                <div>
                  <h2 className="font-headline text-3xl mb-6 text-yellow-400">6. Why SUI?</h2>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>• Dynamic "Living Assets"</li>
                    <li>• Sub-second scaling</li>
                    <li>• Ultra-low gas fees</li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* ROADMAP & FINAL WORD */}
            <motion.section 
              {...fadeInUp}
              className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-3xl comic-border-thick text-center"
            >
              <h2 className="font-headline text-3xl mb-8">Roadmap Summary</h2>
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-12">
                <div><p className="font-bold">2026</p><p className="text-xs">NFT & Merch</p></div>
                <div className="hidden md:block h-px flex-1 bg-black/10 self-center"></div>
                <div><p className="font-bold">2027</p><p className="text-xs">Card Game</p></div>
                <div className="hidden md:block h-px flex-1 bg-black/10 self-center"></div>
                <div><p className="font-bold">2028</p><p className="text-xs">$KPG Deployment</p></div>
              </div>
              <p className="font-headline text-4xl italic mb-4">Stay Pogi.</p>
              <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                Disclaimer: $KPG is a utility and meme token. Engagement with digital assets involves risk.
              </p>
            </motion.section>

          </div>
        </div>
      </main>

      <PageFooter />
    </>
  );
}