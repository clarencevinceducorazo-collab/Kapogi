"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText } from "lucide-react";
import Link from "next/link";

export const HeroSection = () => {
  return (
    <section className="relative w-full min-h-dvh flex items-start lg:items-center justify-center text-white overflow-hidden py-28 lg:py-20">
      {/* Desktop Background */}
      <div className="hidden md:block absolute inset-0">
        <Image
          src="/images/kapogian_background.png"
          alt="Kapogian hero background"
          fill
          className="object-cover"
          priority
          data-ai-hint="fantasy background"
        />
      </div>

      {/* Mobile Background */}
      <div className="block md:hidden absolute inset-0">
        <Image
          src="/images/kapogian_background.png"
          alt="Kapogian hero background mobile"
          fill
          className="object-cover"
          priority
          data-ai-hint="fantasy background mobile"
        />
      </div>

      {/* Foreground Foliage - Decorative */}
      <div className="absolute bottom-0 left-0 w-1/3 z-10"></div>
      <div className="absolute bottom-0 right-0 w-1/4 z-10 transform scale-x-[-1]"></div>

      <div className="relative z-20 container mx-auto grid lg:grid-cols-2 gap-10 items-start lg:items-center">
        <div className="text-center lg:text-left space-y-4 mx-4 lg:mx-16">
          <div className="inline-flex items-center gap-2 bg-[#FFC83D] text-black px-4 py-1 rounded-full text-sm font-bold ml-0 lg:ml-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            MINT LIVE
          </div>
          <h1
            className="font-headline text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white "
            style={{
              textShadow:
                "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 5px 5px 0 #000",
            }}
          >
            KAPOGIAN
          </h1>
          <p className="text-xl md:text-2xl font-bold text-white [text-shadow:2px_2px_0_#000,-2px_2px_0_#000,2px_-2px_0_#000,-2px_-2px_0_#000]">
            Be Pogi!, Be Confident Everyday
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 ">
            <Link href="/summoning">
              <Button
                size="lg"
                className="rounded-full bg-[#FFC83D] text-black hover:bg-[#EAC35F] font-bold text-lg px-8 py-7 "
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Summon my Kapogian Spirit
              </Button>
            </Link>
          </div>
        </div>

        <div className="hidden lg:flex relative justify-center items-end h-[500px] lg:h-[650px]">
          <Image
            src="/images/kpgs.png"
            alt="Kapogian Character"
            width={800}
            height={800}
            className="
              object-contain
              w-[420px]
              lg:w-[600px]
              absolute
              top-0
            "
          />
        </div>
      </div>

      {/* MOBILE Image: Positioned absolutely at the bottom, only visible on mobile */}
      <div className="lg:hidden absolute bottom-[-30vh] left-1/2 -translate-x-1/2 w-full max-w-xl h-[75vh] z-10">
        <Image
          src="/images/kpgs.png"
          alt="Kapogian Character"
          fill
          className="object-contain object-top"
        />
      </div>

      {/* Grass SVG at bottom of section */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-5 pointer-events-none">
        <svg
          className="relative block w-[calc(100%+1.3px)] h-28"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 120"
        >
          <defs>
            <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34eb7a" />
              <stop offset="50%" stopColor="#2ecc71" />
              <stop offset="100%" stopColor="#27ae60" />
            </linearGradient>
          </defs>
          {/* primary turf */}
          <path
            d="M0,120 C100,80 200,100 300,70 C400,40 500,80 600,50 C700,20 800,60 900,30 C1000,0 1100,40 1200,30 L1200,120 L0,120 Z"
            fill="url(#grassGrad)"
          />
          {/* shadow blades for depth */}
          <path
            d="M0,120 C120,90 240,110 360,80 C480,50 600,90 720,60 C840,30 960,70 1080,50 1200,30 L1200,120 L0,120 Z"
            fill="rgba(0,0,0,0.1)"
          />
          {/* light highlight stroke along blade tops */}
          <path
            d="M0,120 C100,80 200,100 300,70 C400,40 500,80 600,50 C700,20 800,60 900,30 C1000,0 1100,40 1200,30"
            fill="none"
            stroke="#7bef8a"
            strokeWidth="4"
            opacity="0.6"
          />
        </svg>
      </div>
    </section>
  );
};
