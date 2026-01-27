'use client';

import { Button } from "@/components/ui/button";
import { Stars } from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";

export function FinalCtaSection() {
    return (
        <div className="bg-primary comic-border-thick rounded-[3rem] p-10 text-center toy-shadow-lg mb-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)"}}></div>
            <div className="relative z-10">
                <h2 className="font-headline text-5xl md:text-6xl text-white text-outline mb-6">READY TO COLLECT?</h2>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                    <ConnectButton className="!bg-white !text-black !comic-border !rounded-xl !px-8 !py-4 !font-headline !text-xl !toy-shadow !hover:bg-slate-50 !transition-all !h-auto" />
                    <Button className="bg-[hsl(var(--brand-yellow))] text-black comic-border rounded-xl px-8 py-4 font-headline text-xl toy-shadow flex items-center justify-center gap-2 hover:bg-[#ffec99] transition-all h-auto">
                        <Stars className="w-7 h-7" />
                        MINT NOW
                    </Button>
                </div>
            </div>
        </div>
    );
}
