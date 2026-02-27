"use client";

import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import Image from "next/image";

// I have to define IconifyIcon for typescript since it's not a standard element
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

export default function EarnPage() {
  return (
    <>
      <div className="bg-gradient-to-b from-sky-200 via-indigo-50 to-white text-slate-700 overflow-x-hidden selection:bg-pink-300 selection:text-white">
        <PageHeader />

        {/* Floating Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div
            className="absolute top-10 right-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute -bottom-32 left-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
            style={{ animationDelay: "4s" }}
          ></div>

          {/* Clouds */}
          <iconify-icon
            icon="solar:cloud-bold"
            className="absolute top-20 left-[10%] text-white opacity-40 text-9xl animate-float-delayed"
          ></iconify-icon>
          <iconify-icon
            icon="solar:cloud-bold"
            className="absolute top-40 right-[15%] text-white opacity-30 text-8xl animate-float"
          ></iconify-icon>
        </div>

        {/* Hero Section */}
        <section
          id="hero"
          className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center pt-24 pb-12 px-4"
        >
          {/* Badges */}
          <div className="flex gap-4 mb-6 animate-float">
            <div className="bg-yellow-300 text-yellow-900 px-4 py-1.5 rounded-full font-extrabold text-xs tracking-wide transform -rotate-3 border-2 border-white shadow-md">
              ✨ MINT LIVE
            </div>
            <div className="bg-green-300 text-green-900 px-4 py-1.5 rounded-full font-extrabold text-xs tracking-wide transform rotate-2 border-2 border-white shadow-md">
              🎮 PLAY NOW
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight leading-none drop-shadow-xl text-outline relative group cursor-default">
            KAPOGIAN
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 mt-2 pb-4">
              EARNIVERSE
            </span>
          </h1>

          <p className="text-lg md:text-xl font-bold text-slate-500 max-w-2xl mb-10 leading-relaxed">
            The cutest Phygital experience on-chain. Collect vinyl-style NFTs,
            battle in Biringan, and farm for real yield.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 mb-16">
            <button className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-lg font-bold px-10 py-4 rounded-3xl shadow-xl shadow-cyan-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all squishy-btn flex items-center gap-2 shine-effect">
              <iconify-icon
                icon="solar:rocket-2-bold"
                width="24"
              ></iconify-icon>
              Start Adventure
            </button>
            <button className="bg-white text-slate-700 text-lg font-bold px-10 py-4 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all squishy-btn flex items-center gap-2 border-2 border-slate-100">
              <iconify-icon
                icon="solar:play-circle-bold-duotone"
                width="24"
                className="text-cyan-500"
              ></iconify-icon>
              Watch Trailer
            </button>
          </div>
        </section>

        {/* Wave Divider */}
        <div className="w-full overflow-hidden leading-[0]">
          <svg
            className="relative block w-full h-[120px]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="#ffffff"
              fill-opacity="1"
              d="M0,160 C320,300 420,0 720,120 C1020,240 1120,40 1440,160 L1440,320 L0,320 Z"
            ></path>
          </svg>
        </div>

        {/* Main Content Grid */}
        <section id="games" className="bg-white relative z-10 py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-cyan-500 font-extrabold tracking-wider uppercase text-sm mb-2 block">
                The Ecosystem
              </span>
              <h2 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight mb-6">
                Choose Your Mode
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Game 1: Conquest (Toy Box Style) */}
              <div className="toy-card rounded-[2.5rem] p-8 relative overflow-hidden group border-2 border-indigo-50">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <iconify-icon
                    icon="solar:swords-bold"
                    width="120"
                  ></iconify-icon>
                </div>

                <div className="relative z-10">
                  <div className="bg-indigo-100 text-indigo-600 inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs mb-6">
                    <iconify-icon icon="solar:flame-bold"></iconify-icon>
                    PVP BATTLES
                  </div>

                  <h3 className="text-3xl font-black text-slate-800 mb-2">
                    Conquest of Biringan
                  </h3>
                  <p className="text-slate-500 font-semibold mb-8">
                    Tactical card battles with 3D chibi warriors.
                  </p>

                  {/* Visual Representation */}
                  <div className="bg-gradient-to-b from-indigo-500 to-purple-600 rounded-3xl p-6 mb-8 shadow-inner relative overflow-hidden h-64 flex items-center justify-center">
                    <Image
                      src="/images/earn/biringan.png"
                      alt="Biringan Conquest"
                      width={500}
                      height={200}
                      className="object-contain transform-gpu hover:scale-105 transition-transform duration-300 tiny-blur"
                    />

                    {/* Coming Soon Ribbon (cartoonish) */}
                    <div className="absolute top-4 right-[-18px] transform rotate-12 pointer-events-none">
                      <div className="bg-pink-500 text-white font-extrabold uppercase tracking-wide px-5 py-2 rounded-full shadow-2xl text-sm">
                        Coming Soon
                      </div>
                    </div>

                    {/* Cartoon Sticker */}
                    <div className="absolute left-4 bottom-4 bg-yellow-300 text-yellow-900 rounded-full px-3 py-2 font-black flex items-center gap-2 shadow-lg animate-bounce">
                      <iconify-icon
                        icon="solar:star-bold"
                        className="text-white"
                      ></iconify-icon>
                      New
                    </div>

                    {/* Tiny Confetti */}
                    <iconify-icon
                      icon="solar:circle-bold"
                      className="absolute top-6 left-6 text-white text-xs opacity-80 animate-pulse"
                    ></iconify-icon>

                    {/* Sparkles */}
                    <iconify-icon
                      icon="solar:star-bold"
                      className="absolute top-4 left-4 text-yellow-300 text-2xl animate-spin-slow"
                    ></iconify-icon>
                    <iconify-icon
                      icon="solar:star-bold"
                      className="absolute bottom-10 right-10 text-pink-300 text-xl animate-bounce"
                    ></iconify-icon>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3">
                      <iconify-icon
                        icon="solar:sword-bold"
                        className="text-pink-400"
                      ></iconify-icon>
                      <div className="h-3 flex-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-400 w-[80%] rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <iconify-icon
                        icon="solar:shield-bold"
                        className="text-cyan-400"
                      ></iconify-icon>
                      <div className="h-3 flex-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 w-[60%] rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 squishy-btn">
                    Play This Game!
                    <iconify-icon icon="solar:arrow-right-bold"></iconify-icon>
                  </button>
                </div>
              </div>

              {/* Game 2: Kapogian Farm (Isometric/Green) */}
              <div className="toy-card rounded-[2.5rem] p-8 relative overflow-hidden group border-2 border-green-50">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <iconify-icon
                    icon="solar:leaf-bold"
                    width="120"
                  ></iconify-icon>
                </div>

                <div className="relative z-10">
                  <div className="bg-green-100 text-green-600 inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs mb-6">
                    <iconify-icon icon="solar:sun-2-bold"></iconify-icon>
                    YIELD FARMING
                  </div>

                  <h3 className="text-3xl font-black text-slate-800 mb-2">
                    Kapogian Farm
                  </h3>
                  <p className="text-slate-500 font-semibold mb-8">
                    Raise pets, and earn tokens.
                  </p>

                  <div className="bg-gradient-to-b from-green-400 to-emerald-600 rounded-3xl p-6 mb-8 shadow-inner relative overflow-hidden h-64 flex items-center justify-center">
                    <Image
                      src="/images/earn/kapogianFarm.png"
                      alt="Kapogian Farm"
                      width={500}
                      height={200}
                      className="object-contain transform-gpu hover:scale-105 transition-transform duration-300 tiny-blur"
                    />

                    {/* Coming Soon Ribbon (green cartoon) */}
                    <div className="absolute top-4 right-[-18px] transform rotate-12 pointer-events-none">
                      <div className="bg-emerald-600 text-white font-extrabold uppercase tracking-wide px-5 py-2 rounded-full shadow-2xl text-sm">
                        Coming Soon
                      </div>
                    </div>

                    {/* Cartoon Leaf Sticker */}
                    <div className="absolute right-4 bottom-4 bg-white text-emerald-700 rounded-full px-3 py-2 font-black flex items-center gap-2 shadow-lg animate-bounce">
                      <iconify-icon
                        icon="solar:leaf-bold"
                        className="text-emerald-600"
                      ></iconify-icon>
                      Soon
                    </div>
                  </div>

                  {/* Pill Info */}
                  <div className="flex gap-2 mb-8 flex-wrap">
                    <div className="bg-green-50 px-3 py-2 rounded-xl text-green-700 font-bold text-xs flex items-center gap-1">
                      <iconify-icon icon="solar:clock-circle-bold"></iconify-icon>{" "}
                      24h Harvest
                    </div>
                    <div className="bg-yellow-50 px-3 py-2 rounded-xl text-yellow-700 font-bold text-xs flex items-center gap-1">
                      <iconify-icon icon="solar:star-circle-bold"></iconify-icon>{" "}
                      Rare Seeds
                    </div>
                  </div>

                  <button className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 squishy-btn shadow-lg shadow-emerald-200">
                    Play This Game!
                    <iconify-icon icon="solar:map-arrow-right-bold"></iconify-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* $POGI Token Section */}
        <section id="token" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white to-yellow-50 z-0"></div>

          <div className="max-w-5xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-16">
            {/* Coin Visual */}
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative w-64 h-64 group">
                {/* Glow */}
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                {/* Coin Construction */}
                <div className="w-full h-full bg-gradient-to-tr from-yellow-500 via-yellow-300 to-yellow-600 rounded-full shadow-2xl flex items-center justify-center border-[12px] border-yellow-200 animate-float">
                  <div className="w-48 h-48 border-4 border-yellow-600/20 rounded-full flex items-center justify-center relative overflow-hidden">
                    {/* Shine sweep on coin */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-40 w-full h-full transform -rotate-45 translate-x-[-100%] animate-[shine-sweep_3s_infinite]"></div>

                    <span className="text-6xl font-black text-yellow-800 tracking-tighter drop-shadow-md">
                      $POGI
                    </span>
                  </div>
                </div>
                {/* Floating sparkles around coin */}
                <iconify-icon
                  icon="solar:star-bold"
                  className="absolute top-0 right-0 text-yellow-500 text-3xl animate-bounce"
                ></iconify-icon>
                <iconify-icon
                  icon="solar:star-bold"
                  className="absolute bottom-10 left-0 text-yellow-500 text-2xl animate-pulse"
                ></iconify-icon>
              </div>
            </div>

            {/* Content */}
            <div className="w-full md:w-1/2 text-center md:text-left">
              <div className="inline-block bg-yellow-100 text-yellow-700 px-4 py-1 rounded-full font-bold text-xs mb-4 border border-yellow-200">
                ECOSYSTEM UTILITY
              </div>
              <h2 className="text-5xl font-black text-slate-800 mb-6 tracking-tight leading-tight">
                The Fuel of
                <br />
                Fun.
              </h2>
              <p className="text-lg font-bold text-slate-500 mb-8 leading-relaxed">
                $POGI isn't just a token. It's your ticket to upgrades,
                breeding, and governance. Earn it by playing, spend it to win.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center md:items-start">
                  <iconify-icon
                    icon="solar:bag-heart-bold"
                    className="text-pink-400 text-2xl mb-2"
                  ></iconify-icon>
                  <span className="font-bold text-slate-700">Marketplace</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center md:items-start">
                  <iconify-icon
                    icon="solar:gamepad-charge-bold"
                    className="text-cyan-400 text-2xl mb-2"
                  ></iconify-icon>
                  <span className="font-bold text-slate-700">Level Ups</span>
                </div>
              </div>

              <button className="bg-yellow-400 text-yellow-900 text-lg font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-200/50 squishy-btn">
                View Tokenomics
              </button>
            </div>
          </div>
        </section>

        {/* Phygital Story */}
        <section id="story" className="py-24 bg-white px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">
                Digital Soul, Physical Toy
              </h2>
              <p className="text-slate-500 font-bold">
                Bridging the gap between your shelf and the blockchain.
              </p>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-0 -translate-y-1/2 rounded-full"></div>

              {/* Step 1 */}
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-slate-50 relative z-10 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <iconify-icon
                    icon="solar:box-minimalistic-bold-duotone"
                    className="text-blue-500 text-4xl"
                  ></iconify-icon>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                  1. Unbox
                </h3>
                <p className="text-slate-500 font-semibold text-sm">
                  Order your vinyl toy. It comes with a unique NFC chip embedded
                  in the foot.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-slate-50 relative z-10 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <iconify-icon
                    icon="solar:smartphone-2-bold-duotone"
                    className="text-purple-500 text-4xl"
                  ></iconify-icon>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                  2. Scan
                </h3>
                <p className="text-slate-500 font-semibold text-sm">
                  Tap your phone to the toy to claim your Digital Twin NFT
                  instantly.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-slate-50 relative z-10 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <iconify-icon
                    icon="solar:gamepad-bold-duotone"
                    className="text-pink-500 text-4xl"
                  ></iconify-icon>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                  3. Play
                </h3>
                <p className="text-slate-500 font-semibold text-sm">
                  Use your character in-game. Stats improve as you hold the
                  physical toy.
                </p>
              </div>
            </div>
          </div>
        </section>
        <PageFooter />
      </div>
    </>
  );
}
