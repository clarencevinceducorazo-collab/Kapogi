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
      
      {/* --- BACKGROUND SECTIONS --- */}
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
              The Kapogian Ecosystem
            </h1>
            <p className="font-bold text-black/60 uppercase text-sm">
              A Multi-Dimensional Protocol | Version 3.1
            </p>
            <p className="font-headline text-xl mt-2 text-black/80 italic">
              "Everyone is Good Looking"
            </p>
          </motion.div>

          {/* CONTENT SECTIONS */}
          <div className="space-y-8">
            
            {/* 1. EXECUTIVE SUMMARY */}
            <motion.section 
              {...fadeInUp}
              className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-3xl comic-border-thick toy-shadow-sm"
            >
              <h2 className="font-headline text-3xl mb-6 text-blue-600">1. Executive Summary</h2>
              <div className="space-y-4 text-slate-800 leading-relaxed">
                <p>
                  Kapogian is a comprehensive <strong>"Phygital"</strong> (Physical + Digital) ecosystem 
                  built on the Sui Network, designed to bridge the gap between digital ownership, 
                  high-stakes gaming, and real-world agricultural impact. Our mission is to empower 
                  the <strong>"Pogi"</strong> (confident and capable) spirit within every individual, 
                  proving that identity is a source of power.
                </p>
                <p>
                  By centering on the Kapogian Spirit, we have created a narrative universe that 
                  integrates the phantom metropolis of <strong>Biringan City</strong> and the sustainable 
                  agriculture of <strong>Kapogian Farm</strong>, all unified under a single technological 
                  and cultural framework.
                </p>
              </div>
            </motion.section>

            {/* 2. CORE IDENTITY */}
            <motion.section 
              {...fadeInUp}
              className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-3xl comic-border-thick"
            >
              <h2 className="font-headline text-3xl mb-6 text-blue-600">2. Core Identity: The Kapogian NFT</h2>
              <p className="mb-6 text-slate-800 leading-relaxed">
                The <strong>Kapogian Spirit NFT</strong> is the heartbeat of the ecosystem. It is more 
                than a digital asset; it is a dynamic digital idol that serves as your primary avatar 
                and <strong>"Proof of Pogi"</strong> across all project dimensions.
              </p>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-black/10">
                  <h3 className="font-bold text-lg mb-3">Traits as Power</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Stats like <strong>Cuteness (VIT)</strong>, <strong>Confidence (STR)</strong>, 
                    and <strong>Tili (Energy)</strong> are on-chain metadata that determine your performance 
                    in the Biringan dimension and your eligibility for rewards in the Farm dimension.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg text-center">
                      <p className="font-bold text-xs">Cuteness (VIT)</p>
                      <p className="text-[10px] text-slate-500">Defense Power</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center">
                      <p className="font-bold text-xs">Confidence (STR)</p>
                      <p className="text-[10px] text-slate-500">Attack Power</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center">
                      <p className="font-bold text-xs">Tili (Energy)</p>
                      <p className="text-[10px] text-slate-500">Stamina</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-400/30">
                  <h3 className="font-bold text-lg mb-3">The "Phygital" Bridge</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Ownership of a Kapogian NFT grants exclusive access to 1-to-1 unique physical merchandise—
                    ensuring your digital identity has a tangible real-world presence.
                  </p>
                  <div className="grid sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-lg text-center border-2 border-black">
                      <p className="font-bold text-xs">T-Shirts</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center border-2 border-black">
                      <p className="font-bold text-xs">Hoodies</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center border-2 border-black">
                      <p className="font-bold text-xs">Mugs</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center border-2 border-black">
                      <p className="font-bold text-xs">Aluminum Plates</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* 3. GAMING DIMENSION */}
            <motion.section 
              {...fadeInUp}
              className="bg-slate-900 text-white p-8 md:p-12 rounded-3xl comic-border-thick"
            >
              <h2 className="font-headline text-3xl mb-6 text-yellow-400">3. The Gaming Dimension: Conquest of Biringan City</h2>
              <p className="mb-6 text-slate-200 leading-relaxed">
                Set in a parallel dimension inspired by the folklore of Samar, Philippines, this 
                <strong> Souls-like side-scroller</strong> introduces permanent narrative stakes to the blockchain.
              </p>

              <div className="space-y-6">
                <div className="border-l-4 border-yellow-400 pl-6">
                  <h3 className="font-bold text-xl mb-2 text-yellow-300">The Narrative</h3>
                  <p className="text-sm text-slate-300">
                    Players use their Kapogian Spirits to battle the <strong>Dalaketnon elite</strong>—
                    aristocrats who extract human "Light" (talent and confidence) to power their eternal city.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <h3 className="font-bold text-xl mb-4 text-yellow-300">Social Anxiety System</h3>
                  <p className="text-sm text-slate-300 mb-4">
                    Traditional HP is replaced by <strong>"Aura Shields"</strong> (scaled by NFT Cuteness). 
                    Taking damage causes your character to desaturate and fade into the background, 
                    reflecting a loss of self-presence.
                  </p>
                </div>

                <div className="bg-red-900/30 border-2 border-red-500/50 p-6 rounded-xl">
                  <h3 className="font-bold text-xl mb-2 text-red-400">⚠️ Permadeath (The Bugkot Function)</h3>
                  <p className="text-sm text-slate-200">
                    If your spirit "dies" in Biringan, the NFT is <strong>locked/burned</strong> into 
                    a "Hall of Fame." It remains a trophy in blockchain history but is permanently lost 
                    to the player, enforcing high-stakes gameplay.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* 4. PHYGITAL DIMENSION: FARM */}
            <motion.section 
              {...fadeInUp}
              className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-3xl comic-border-thick"
            >
              <h2 className="font-headline text-3xl mb-6 text-green-600">4. The Phygital Dimension: Kapogian Farm</h2>
              <p className="mb-6 text-slate-800 leading-relaxed">
                Kapogian Farm leverages the Sui Network to bridge digital ownership with real-world 
                agriculture, allowing participants to invest in tangible livestock.
              </p>

              <div className="space-y-6">
                <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
                  <h3 className="font-bold text-lg mb-3 text-green-700">The Evolution</h3>
                  <p className="text-sm text-slate-700">
                    Users "remint" their Kapogian NFT into a <strong>Kapogian Farm NFT</strong> by 
                    injecting capital to purchase real-world livestock (Goat, Pig, Cow, or Carabao).
                  </p>
                </div>

                <div className="grid sm:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-xl border-2 border-green-300 text-center">
                    <p className="text-2xl mb-1">🐐</p>
                    <p className="font-bold text-xs">Goat</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border-2 border-green-300 text-center">
                    <p className="text-2xl mb-1">🐷</p>
                    <p className="font-bold text-xs">Pig</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border-2 border-green-300 text-center">
                    <p className="text-2xl mb-1">🐄</p>
                    <p className="font-bold text-xs">Cow</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border-2 border-green-300 text-center">
                    <p className="text-2xl mb-1">🐃</p>
                    <p className="font-bold text-xs">Carabao</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                  <h3 className="font-bold text-lg mb-3 text-blue-700">The Daily Report Loop</h3>
                  <p className="text-sm text-slate-700">
                    Real-world farmers upload daily photos and health stats. To maintain the digital 
                    twin's "Active" status, players must acknowledge these reports, creating a direct 
                    connection between the investor and the animal.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border-2 border-black/10">
                  <h3 className="font-bold text-lg mb-4 text-slate-800">Economic Sustainability</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        70%
                      </div>
                      <div>
                        <p className="font-bold text-sm">Harvest Payout</p>
                        <p className="text-xs text-slate-600">
                          70% of revenue from real-world livestock sales is distributed to the NFT holder.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        4G
                      </div>
                      <div>
                        <p className="font-bold text-sm">Investment Halving</p>
                        <p className="text-xs text-slate-600">
                          Owners retain a claim on the lineage of animal offspring up to the 4th generation, 
                          creating a sustainable multi-generational reward system.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* 5. $POGI TOKEN */}
            <motion.section 
              {...fadeInUp}
              className="bg-yellow-400 p-8 md:p-12 rounded-3xl comic-border-thick"
            >
              <h2 className="font-headline text-3xl mb-6 text-black">5. The Internal Economy: $POGI Utility</h2>
              <p className="mb-6 text-black/80 leading-relaxed">
                To facilitate transactions across this multi-dimensional ecosystem, we utilize 
                <strong> $POGI</strong> as the native utility token.
              </p>

              <div className="bg-black/10 backdrop-blur-sm p-6 rounded-xl mb-6">
                <p className="font-bold text-2xl mb-2">Total Supply</p>
                <p className="text-4xl font-headline">1,000,000,000 $POGI</p>
                <p className="text-sm text-black/60 mt-1">(1 Billion Tokens)</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-xl mb-4">Utility Pillars</h3>
                
                <div className="bg-white p-5 rounded-xl border-2 border-black">
                  <h4 className="font-bold mb-2">🎮 Ecosystem Access</h4>
                  <p className="text-sm text-slate-600">
                    Used for Biringan "Ritual Fees" and purchasing Farm inputs.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border-2 border-black">
                  <h4 className="font-bold mb-2">🛍️ The Pogi Storefront</h4>
                  <p className="text-sm text-slate-600">
                    The primary payment method for 1-to-1 unique merchandise, offering deep integration 
                    between digital holdings and physical goods.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border-2 border-black">
                  <h4 className="font-bold mb-2">💧 Protocol Liquidity</h4>
                  <p className="text-sm text-slate-600">
                    Establishing a stable, tradeable economy to support long-term asset value.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* 6. ROADMAP */}
            <motion.section 
              {...fadeInUp}
              className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-3xl comic-border-thick"
            >
              <h2 className="font-headline text-3xl mb-8 text-center text-blue-600">6. The 2026 Master Roadmap</h2>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-l-4 border-purple-500">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">PHASE 1</span>
                    <h3 className="font-bold text-lg">Genesis</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Finalization of Art, Community Building, and Smart Contract audits on Sui.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border-l-4 border-blue-500">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">PHASE 2</span>
                    <h3 className="font-bold text-lg">Kapogian NFT & Merch Utility</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Launch of the Kapogian Spirit NFT Collection & the 1-to-1 Merch Store 
                    (Apparel, Mugs, Aluminum Plates).
                  </p>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border-l-4 border-red-500">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">PHASE 3</span>
                    <h3 className="font-bold text-lg">Conquest of Biringan City</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Release of the high-stakes side-scroller with Permadeath mechanics and 
                    "Lord of Biringan" rewards.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-l-4 border-green-500">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">PHASE 4</span>
                    <h3 className="font-bold text-lg">Kapogian Farm & RWA Launch</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Deployment of the Phygital Farming simulation and launch of the Kapogian Farm NFT Collection.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-6 rounded-xl border-l-4 border-indigo-500">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold">PHASE 5</span>
                    <h3 className="font-bold text-lg">Utility Expansion</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Integration of trait-based MMR systems and expansion of the livestock investment classes.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border-l-4 border-yellow-500">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">PHASE 6</span>
                    <h3 className="font-bold text-lg">The $POGI TGE</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Official launch of the $POGI utility token with liquidity injection and 
                    full ecosystem integration.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* 7. TECHNICAL EXCELLENCE */}
            <motion.section 
              {...fadeInUp}
              className="bg-black text-white p-8 md:p-12 rounded-3xl comic-border-thick"
            >
              <h2 className="font-headline text-3xl mb-6 text-yellow-400">7. Technical Excellence on SUI</h2>
              <div className="space-y-6">
                <p className="text-slate-200 leading-relaxed">
                  Kapogian utilizes <strong>SUI's Object-Centric Model</strong> to ensure assets are 
                  truly "living." Metadata—from an animal's weight to a warrior's confidence—evolves 
                  in real-time.
                </p>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl">
                    <h4 className="font-bold mb-2 text-yellow-300">Dynamic "Living Assets"</h4>
                    <p className="text-xs text-slate-300">
                      On-chain metadata that evolves with gameplay and real-world events
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl">
                    <h4 className="font-bold mb-2 text-yellow-300">Sub-Second Scaling</h4>
                    <p className="text-xs text-slate-300">
                      High-speed transactions for seamless gaming experience
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl">
                    <h4 className="font-bold mb-2 text-yellow-300">Ultra-Low Gas Fees</h4>
                    <p className="text-xs text-slate-300">
                      Cost-effective operations across all ecosystem dimensions
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 text-center pt-4">
                  This high-speed, scalable infrastructure ensures that every <strong>"Pogi"</strong> action 
                  has an immediate and secure on-chain impact.
                </p>
              </div>
            </motion.section>

            {/* FINAL WORD */}
            <motion.section 
              {...fadeInUp}
              className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 p-8 md:p-12 rounded-3xl comic-border-thick text-center"
            >
              <p className="font-headline text-5xl md:text-6xl mb-4 text-white drop-shadow-lg">
                Stay Pogi.
              </p>
              <p className="font-headline text-3xl md:text-4xl text-white/90 drop-shadow-md">
                Own Your Light.
              </p>
              
              <div className="mt-12 bg-black/20 backdrop-blur-sm p-6 rounded-xl">
                <p className="text-xs text-white/80 max-w-2xl mx-auto leading-relaxed">
                  <strong>Disclaimer:</strong> Kapogian NFTs and $POGI are digital assets designed for 
                  community engagement, gaming, and brand participation. This project involves a long-term 
                  roadmap. Always perform your own research (DYOR) before participating.
                </p>
              </div>
            </motion.section>

          </div>
        </div>
      </main>

      <PageFooter />
    </>
  );
}