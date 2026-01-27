'use client';

import { Button } from "@/components/ui/button";
import { WandSparkles, FileText } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import Link from "next/link";

export function FinalCtaSection({ onWhitepaperOpen }: { onWhitepaperOpen: () => void }) {
    const [ref, inView] = useInView({ threshold: 0.4, triggerOnce: false });
    
    return (
        <div ref={ref} className={`bg-primary comic-border-thick rounded-[3rem] p-10 text-center toy-shadow-lg mb-12 relative overflow-hidden transition-all duration-800 ease-premium-ease ${inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="absolute inset-0 opacity-20 animate-bg-scroll" style={{backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)"}}></div>
            <div className="relative z-10">
                <h2 className="font-headline text-5xl md:text-6xl text-white text-outline mb-6">READY TO COLLECT?</h2>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                    <Link href="/generate">
                        <Button className="bg-white text-black comic-border rounded-xl px-8 py-4 font-headline text-xl toy-shadow flex items-center justify-center gap-2 hover:bg-slate-50 transition-all h-auto active:scale-95 active:shadow-none">
                            <WandSparkles className="w-7 h-7" />
                            Generate
                        </Button>
                    </Link>
                    <Button 
                        onClick={onWhitepaperOpen}
                        className="bg-[hsl(var(--brand-yellow))] text-black comic-border rounded-xl px-8 py-4 font-headline text-xl toy-shadow flex items-center justify-center gap-2 hover:bg-[#ffec99] transition-all h-auto animate-breathe active:scale-95 active:shadow-none">
                        <FileText className="w-7 h-7" />
                        Whitepaper
                    </Button>
                </div>
            </div>
        </div>
    );
}
