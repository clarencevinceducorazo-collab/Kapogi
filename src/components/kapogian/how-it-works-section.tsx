'use client';

import { Wallet, WandSparkles, Box } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

export function HowItWorksSection() {
    const [ref, inView] = useInView({ threshold: 0.3, triggerOnce: false });

    const steps = [
        { icon: Wallet, title: "CONNECT", description: "Link your SUI wallet to access the factory.", delay: 0 },
        { icon: WandSparkles, title: "GENERATE", description: "Create your unique 1/1 character.", delay: 120 },
        { icon: Box, title: "CLAIM", description: "Mint and order your physical merch.", delay: 240 },
    ];

    return (
        <div ref={ref} className="mb-12">
            <div className="bg-white px-6 py-2 inline-block comic-border rounded-t-2xl border-b-0 ml-8 relative z-10">
                <h3 className="font-headline text-2xl">INSTRUCTIONS</h3>
            </div>
            <div className="bg-white comic-border-thick rounded-[2rem] rounded-tl-none p-8 md:p-10 toy-shadow relative z-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <div key={index} style={{ transitionDelay: `${step.delay}ms`}} className={`bg-[#f8f9fa] comic-border rounded-2xl p-6 flex flex-col items-center text-center group hover:bg-[#e7f5ff] transition-all duration-700 ease-premium-ease hover:animate__animated hover:animate__swing ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="w-16 h-16 bg-white comic-border rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <step.icon className={cn("w-8 h-8 opacity-0", inView && 'animate-icon-bounce')} strokeWidth={1.5} style={{animationDelay: `${step.delay + 200}ms`}} />
                            </div>
                            <h4 className="font-headline text-xl mb-2">{step.title}</h4>
                            <p className="text-sm font-semibold text-slate-500">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
