'use client';

import { Button } from "@/components/ui/button";
import { WandSparkles, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CustomConnectButton } from "@/components/kapogian/CustomConnectButton";
import { useEffect, useState, useRef } from "react";
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

export function PageHeader({ onWhitepaperOpen }: { onWhitepaperOpen: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hinge and hide when scrolling down past a threshold
      if (currentScrollY > lastScrollY.current && currentScrollY > 150) {
        if(isVisible) setIsVisible(false);
      } 
      // Bounce in ONLY when scrolling up and back in the hero section area
      else if (currentScrollY < lastScrollY.current && currentScrollY < 150) {
        if(!isVisible) setIsVisible(true);
      }
      
      setIsScrolled(window.scrollY > 20);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isVisible]);

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-premium-ease animate__animated", isScrolled ? 'bg-[hsl(var(--brand-yellow))] shadow-lg' : 'bg-transparent', isVisible ? 'animate__bounceInDown' : 'animate__hinge')}>
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
          <div className="flex items-center gap-2">
            <Link href="/generate">
              <Button
                className="bg-primary hover:bg-red-500 text-primary-foreground comic-border rounded-full px-6 py-2 font-headline text-lg flex items-center gap-2 h-auto animate-soft-pulse"
                aria-label="Generate"
              >
                <WandSparkles className="w-6 h-6" strokeWidth={2.5} />
                <span className="hidden sm:inline">GENERATE</span>
              </Button>
            </Link>
             <Button
                onClick={onWhitepaperOpen}
                variant="outline"
                className="bg-white hover:bg-slate-100 text-black comic-border rounded-full px-6 py-2 font-headline text-lg flex items-center gap-2 h-auto"
                aria-label="Whitepaper"
              >
                <FileText className="w-5 h-5" strokeWidth={2.5} />
                <span className="hidden sm:inline">Whitepaper</span>
              </Button>
          </div>

          <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className={cn(
              "bg-white comic-border rounded-full flex items-center justify-center toy-shadow rotate-3 z-10 overflow-hidden animate-float-y transition-all duration-300 ease-premium-ease",
              isScrolled ? 'w-12 h-12' : 'w-20 h-20'
            )}>
                <Image src="/images/Kapogian.webp" alt="Kapogian Logo" width={80} height={80} />
            </div>
          </div>

          <CustomConnectButton 
            className="!bg-accent !hover:bg-blue-500 !text-accent-foreground !comic-border !rounded-full !px-6 !py-2 !font-headline !text-lg !h-auto"
            connectedClassName="!bg-accent !hover:!bg-blue-500 !text-accent-foreground"
          />
        </div>
      </nav>
    </header>
  );
}
