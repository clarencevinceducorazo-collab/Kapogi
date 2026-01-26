import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WandSparkles, Wallet } from "lucide-react";

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
  return (
    <header className="relative z-40">
      <div className="bg-black text-[hsl(var(--brand-yellow))] py-3 overflow-hidden border-b-4 border-black relative z-50">
        <div className="flex animate-marquee">
          <TickerContent />
          <TickerContent />
          <TickerContent />
          <TickerContent />
        </div>
      </div>
      <nav className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white comic-border rounded-full p-2 flex justify-between items-center toy-shadow relative">
          <Button
            className="bg-primary hover:bg-red-500 text-primary-foreground comic-border rounded-full px-6 py-2 font-headline text-lg flex items-center gap-2 h-auto"
            aria-label="Generate"
          >
            <WandSparkles className="w-6 h-6" strokeWidth={2.5} />
            <span className="hidden sm:inline">GENERATE</span>
          </Button>

          <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-20 h-20 bg-white comic-border rounded-full flex items-center justify-center toy-shadow rotate-3 z-10">
              <span className="font-headline text-3xl tracking-tighter">KP</span>
            </div>
          </div>

          <Button
            className="bg-accent hover:bg-blue-500 text-accent-foreground comic-border rounded-full px-6 py-2 font-headline text-lg flex items-center gap-2 h-auto"
            aria-label="Connect Wallet"
          >
            <span className="hidden md:inline">CONNECT WALLET</span>
            <Wallet className="w-6 h-6" strokeWidth={2.5} />
          </Button>
        </div>
      </nav>
    </header>
  );
}
