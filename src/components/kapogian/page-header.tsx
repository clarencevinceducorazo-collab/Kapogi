'use client';

import { Button } from "@/components/ui/button";
import { WandSparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TickerContent = () => (
    <div className="flex shrink-0 items-center gap-8 font-headline text-sm tracking-widest">
        <span>★ OFFICIAL KAPOGIAN MERCHANDISE ★</span>
        <span className="text-black">MINTING LIVE</span>
        <span>SERIES 1</span>
        <span className="text-black">PHYSICAL + DIGITAL</span>
        <span>SECURE SHIPPING</span>
    </div>
);

export function PageHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-premium-ease", isScrolled ? 'bg-[hsl(var(--brand-yellow))] shadow-lg' : 'bg-transparent')}>
      <div className={cn(
          "bg-black text-[hsl(var(--brand-yellow))] overflow-hidden border-b-4 border-black relative z-50 transition-all duration-300 ease-premium-ease",
          isScrolled ? 'py-1' : 'py-3 animate-slide-down-fade'
        )}>
        <div className="flex animate-marquee">
          <TickerContent />
          <TickerContent />
          <TickerContent />
          <TickerContent />
        </div>
      </div>
      <nav className={cn("max-w-7xl mx-auto px-4 transition-all duration-300 ease-premium-ease", isScrolled ? 'py-3' : 'py-6')}>
        <div className="bg-white comic-border rounded-full p-2 flex justify-between items-center toy-shadow relative">
          <Link href="/generate">
            <Button
              className="bg-primary hover:bg-red-500 text-primary-foreground comic-border rounded-full px-6 py-2 font-headline text-lg flex items-center gap-2 h-auto animate-soft-pulse"
              aria-label="Generate"
            >
              <WandSparkles className="w-6 h-6" strokeWidth={2.5} />
              <span className="hidden sm:inline">GENERATE</span>
            </Button>
          </Link>

          <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className={cn(
              "bg-white comic-border rounded-full flex items-center justify-center toy-shadow rotate-3 z-10 overflow-hidden animate-float-y transition-all duration-300 ease-premium-ease",
              isScrolled ? 'w-12 h-12' : 'w-20 h-20'
            )}>
                <Image src="/images/Kapogian.webp" alt="Kapogian Logo" width={80} height={80} />
            </div>
          </div>

          <ConnectButton className="!bg-accent !hover:bg-blue-500 !text-accent-foreground !comic-border !rounded-full !px-6 !py-2 !font-headline !text-lg !h-auto" />
        </div>
      </nav>
    </header>
  );
}
