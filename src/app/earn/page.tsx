"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import Image from "next/image";

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

// ─── Shared: lock body scroll ─────────────────────────────────────────────────
function useLockScroll() {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
}

// ─── Trailer Modal ────────────────────────────────────────────────────────────
function TrailerModal({ onClose }: { onClose: () => void }) {
  useLockScroll();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative z-10 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-white/10"
        style={{
          animation: "modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <iconify-icon icon="solar:play-bold" class="text-white text-sm" />
            </div>
            <span className="text-white font-black tracking-tight text-lg">
              KAPOGIAN EARNIVERSE — Official Trailer
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-all hover:rotate-90 active:scale-90"
          >
            <iconify-icon icon="solar:close-bold" class="text-white text-lg" />
          </button>
        </div>
        {/* Video 16:9 */}
        <div
          className="relative w-full bg-black"
          style={{ paddingTop: "56.25%" }}
        >
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
            title="Kapogian Earniverse Trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {/* Footer strip */}
        <div className="bg-slate-900 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-white/50 text-xs font-bold uppercase tracking-widest">
              Phygital on Sui
            </span>
          </div>
          <div className="flex gap-2">
            <div className="bg-yellow-300 text-yellow-900 px-3 py-1 rounded-full font-extrabold text-[10px] tracking-wide">
              ✨ MINT LIVE
            </div>
            <div className="bg-green-300 text-green-900 px-3 py-1 rounded-full font-extrabold text-[10px] tracking-wide">
              🎮 PLAY NOW
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes modalPop { from{opacity:0;transform:scale(0.85) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>
    </div>
  );
}

// ─── Adventure Modal ──────────────────────────────────────────────────────────
function AdventureModal({ onClose }: { onClose: () => void }) {
  useLockScroll();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const games = [
    {
      id: "biringan",
      title: "Conquest of Biringan",
      subtitle: "PVP Battles",
      desc: "Tactical card battles with 3D chibi warriors. Earn $POGI by defeating opponents.",
      badge: "⚔️ BATTLE",
      badgeBg: "bg-indigo-100 text-indigo-700",
      gradient: "from-indigo-500 to-purple-600",
      btnBg: "bg-slate-900 hover:bg-slate-800",
      btnText: "text-white",
      shadow: "shadow-indigo-200",
      icon: "solar:swords-bold",
      iconColor: "text-indigo-400",
      img: "/images/earn/biringan.png",
      tag: "Coming Soon",
      tagBg: "bg-pink-500",
      href: "#",
    },
    {
      id: "farm",
      title: "Kapogian Farm",
      subtitle: "Yield Farming",
      desc: "Raise pets, grow crops, and earn tokens. Your on-chain garden never sleeps.",
      badge: "🌿 FARM",
      badgeBg: "bg-green-100 text-green-700",
      gradient: "from-green-400 to-emerald-600",
      btnBg: "bg-emerald-500 hover:bg-emerald-600",
      btnText: "text-white",
      shadow: "shadow-emerald-200",
      icon: "solar:leaf-bold",
      iconColor: "text-emerald-400",
      img: "/images/earn/kapogianFarm.png",
      tag: "Coming Soon",
      tagBg: "bg-emerald-600",
      href: "#",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div
        className="relative z-10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-white"
        style={{
          animation: "modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <iconify-icon
                icon="solar:rocket-2-bold"
                class="text-white text-base"
              />
            </div>
            <div>
              <p className="text-white font-black text-lg leading-none">
                Choose Your Adventure
              </p>
              <p className="text-white/70 text-xs font-semibold mt-0.5">
                Select a game to start playing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-all hover:rotate-90 active:scale-90"
          >
            <iconify-icon icon="solar:close-bold" class="text-white text-lg" />
          </button>
        </div>

        {/* Game Cards */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50">
          {games.map((game) => (
            <a
              key={game.id}
              href={game.href}
              className="group bg-white rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col"
            >
              {/* Image area */}
              <div
                className={`relative bg-gradient-to-b ${game.gradient} h-36 flex items-center justify-center overflow-hidden`}
              >
                <Image
                  src={game.img}
                  alt={game.title}
                  width={260}
                  height={130}
                  className="object-contain h-28 w-auto group-hover:scale-105 transition-transform duration-300"
                />
                {/* Coming soon ribbon */}
                <div
                  className={`absolute top-3 right-[-14px] rotate-12 ${game.tagBg} text-white font-extrabold uppercase tracking-wide px-4 py-1 rounded-full text-[10px] shadow-lg`}
                >
                  {game.tag}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide mb-2 w-fit ${game.badgeBg}`}
                >
                  {game.badge}
                </span>
                <h3 className="text-slate-800 font-black text-base leading-tight mb-1">
                  {game.title}
                </h3>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-4 flex-1">
                  {game.desc}
                </p>
                <div
                  className={`w-full ${game.btnBg} ${game.btnText} font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow ${game.shadow}`}
                >
                  Play Now
                  <iconify-icon icon="solar:arrow-right-bold" class="text-sm" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between">
          <p className="text-slate-400 text-xs font-bold">
            More games coming soon
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-400 text-xs font-bold">
              Built on Sui
            </span>
          </div>
        </div>
      </div>

      <style>{`@keyframes modalPop { from{opacity:0;transform:scale(0.85) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EarnPage() {
  const [showTrailer, setShowTrailer] = useState(false);
  const [showAdventure, setShowAdventure] = useState(false);

  return (
    <>
      {showTrailer && <TrailerModal onClose={() => setShowTrailer(false)} />}
      {showAdventure && (
        <AdventureModal onClose={() => setShowAdventure(false)} />
      )}

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
          <div className="flex gap-4 mb-6 animate-float mt-4 sm:mt-0">
            <div className="bg-yellow-300 text-yellow-900 px-4 py-1.5 rounded-full font-extrabold text-xs tracking-wide transform -rotate-3 border-2 border-white shadow-md">
              ✨ MINT LIVE
            </div>
            <div className="bg-green-300 text-green-900 px-4 py-1.5 rounded-full font-extrabold text-xs tracking-wide transform rotate-2 border-2 border-white shadow-md">
              🎮 PLAY NOW
            </div>
          </div>

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

          <div className="flex flex-col md:flex-row gap-4 mb-16">
            {/* Start Adventure → opens AdventureModal */}
            <button
              onClick={() => setShowAdventure(true)}
              className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-lg font-bold px-10 py-4 rounded-3xl shadow-xl shadow-cyan-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all squishy-btn flex items-center gap-2 shine-effect"
            >
              <iconify-icon
                icon="solar:rocket-2-bold"
                width="24"
              ></iconify-icon>
              Start Adventure
            </button>
            {/* Watch Trailer → opens TrailerModal */}
            <button
              onClick={() => setShowTrailer(true)}
              className="bg-white text-slate-700 text-lg font-bold px-10 py-4 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all squishy-btn flex items-center gap-2 border-2 border-slate-100"
            >
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
            className="relative block w-full h-[120px] animate-wave-loop rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="#ffffff"
              fillOpacity="1"
              d="M0,160 C320,300 420,0 720,120 C1020,240 1120,40 1440,160 L1440,320 L0,320 Z"
            ></path>
          </svg>
        </div>

        {/* Games Section */}
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
              {/* Game 1 */}
              <div className="toy-card rounded-[2.5rem] p-8 relative overflow-hidden group border-2 border-indigo-50">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <iconify-icon
                    icon="solar:swords-bold"
                    width="120"
                  ></iconify-icon>
                </div>
                <div className="relative z-10">
                  <div className="bg-indigo-100 text-indigo-600 inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs mb-6">
                    <iconify-icon icon="solar:flame-bold"></iconify-icon> PVP
                    BATTLES
                  </div>
                  <h3 className="text-3xl font-black text-slate-800 mb-2">
                    Conquest of Biringan
                  </h3>
                  <p className="text-slate-500 font-semibold mb-8">
                    Tactical card battles with 3D chibi warriors.
                  </p>
                  <div className="bg-gradient-to-b from-indigo-500 to-purple-600 rounded-3xl p-6 mb-8 shadow-inner relative overflow-hidden h-64 flex items-center justify-center">
                    <Image
                      src="/images/earn/biringan.png"
                      alt="Biringan Conquest"
                      width={500}
                      height={200}
                      className="object-contain transform-gpu hover:scale-105 transition-transform duration-300 tiny-blur"
                    />
                    <div className="absolute top-4 right-[-18px] transform rotate-12 pointer-events-none">
                      <div className="bg-pink-500 text-white font-extrabold uppercase tracking-wide px-5 py-2 rounded-full shadow-2xl text-sm">
                        Coming Soon
                      </div>
                    </div>
                    <div className="absolute left-4 bottom-4 bg-yellow-300 text-yellow-900 rounded-full px-3 py-2 font-black flex items-center gap-2 shadow-lg animate-bounce">
                      <iconify-icon
                        icon="solar:star-bold"
                        className="text-white"
                      ></iconify-icon>{" "}
                      New
                    </div>
                    <iconify-icon
                      icon="solar:star-bold"
                      className="absolute top-4 left-4 text-yellow-300 text-2xl animate-spin-slow"
                    ></iconify-icon>
                    <iconify-icon
                      icon="solar:star-bold"
                      className="absolute bottom-10 right-10 text-pink-300 text-xl animate-bounce"
                    ></iconify-icon>
                  </div>
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
                    Play This Game!{" "}
                    <iconify-icon icon="solar:arrow-right-bold"></iconify-icon>
                  </button>
                </div>
              </div>

              {/* Game 2 */}
              <div className="toy-card rounded-[2.5rem] p-8 relative overflow-hidden group border-2 border-green-50">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <iconify-icon
                    icon="solar:leaf-bold"
                    width="120"
                  ></iconify-icon>
                </div>
                <div className="relative z-10">
                  <div className="bg-green-100 text-green-600 inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs mb-6">
                    <iconify-icon icon="solar:sun-2-bold"></iconify-icon> YIELD
                    FARMING
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
                    <div className="absolute top-4 right-[-18px] transform rotate-12 pointer-events-none">
                      <div className="bg-emerald-600 text-white font-extrabold uppercase tracking-wide px-5 py-2 rounded-full shadow-2xl text-sm">
                        Coming Soon
                      </div>
                    </div>
                    <div className="absolute right-4 bottom-4 bg-white text-emerald-700 rounded-full px-3 py-2 font-black flex items-center gap-2 shadow-lg animate-bounce">
                      <iconify-icon
                        icon="solar:leaf-bold"
                        className="text-emerald-600"
                      ></iconify-icon>{" "}
                      Soon
                    </div>
                  </div>
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
                    Play This Game!{" "}
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
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative w-64 h-64 group">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="w-full h-full bg-gradient-to-tr from-yellow-500 via-yellow-300 to-yellow-600 rounded-full shadow-2xl flex items-center justify-center border-[12px] border-yellow-200 animate-float">
                  <div className="w-48 h-48 border-4 border-yellow-600/20 rounded-full flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-40 w-full h-full transform -rotate-45 translate-x-[-100%] animate-[shine-sweep_3s_infinite]"></div>
                    <span className="text-6xl font-black text-yellow-800 tracking-tighter drop-shadow-md">
                      $POGI
                    </span>
                  </div>
                </div>
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

        {/* Wave Divider (flipped) */}
        <div className="w-full overflow-hidden leading-[0] bg-white">
          <svg
            className="block w-full h-[120px] scale-y-[-1]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="wave-yellow-gradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#fefce8" />
              </linearGradient>
            </defs>
            <path
              fill="url(#wave-yellow-gradient)"
              d="M0,160 C320,300 420,0 720,120 C1020,240 1120,40 1440,160 L1440,320 L0,320 Z"
            />
          </svg>
        </div>

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
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-0 -translate-y-1/2 rounded-full"></div>
              {[
                {
                  num: "1",
                  title: "Unbox",
                  icon: "solar:box-minimalistic-bold-duotone",
                  color: "blue",
                  desc: "Order your vinyl toy. It comes with a unique NFC chip embedded in the foot.",
                },
                {
                  num: "2",
                  title: "Scan",
                  icon: "solar:smartphone-2-bold-duotone",
                  color: "purple",
                  desc: "Tap your phone to the toy to claim your Digital Twin NFT instantly.",
                },
                {
                  num: "3",
                  title: "Play",
                  icon: "solar:gamepad-bold-duotone",
                  color: "pink",
                  desc: "Use your character in-game. Stats improve as you hold the physical toy.",
                },
              ].map(({ num, title, icon, color, desc }) => (
                <div
                  key={num}
                  className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-slate-50 relative z-10 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300"
                >
                  <div
                    className={`w-20 h-20 bg-${color}-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <iconify-icon
                      icon={icon}
                      className={`text-${color}-500 text-4xl`}
                    ></iconify-icon>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">
                    {num}. {title}
                  </h3>
                  <p className="text-slate-500 font-semibold text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PageFooter />
      </div>
    </>
  );
}
