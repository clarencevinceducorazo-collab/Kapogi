'use client';

import { HelpCircle } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";

export function FaqSection() {
    const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

    return (
        <div ref={ref} className="max-w-3xl mx-auto mb-16">
            <h2 className={`font-headline text-4xl text-center text-primary text-outline mb-8 transition-all duration-700 ease-premium-ease ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>FAQ</h2>
            <div className="space-y-4">
                <div style={{ transitionDelay: '100ms' }} className={`bg-white comic-border rounded-xl p-5 toy-shadow transition-all duration-700 ease-premium-ease ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                        <HelpCircle className="text-accent" />
                        Is every Kapogian unique?
                    </h4>
                    <p className="text-slate-600 text-sm pl-7">Yes. 100% deterministic logic ensures no duplicates.</p>
                </div>
                <div style={{ transitionDelay: '200ms' }} className={`bg-white comic-border rounded-xl p-5 toy-shadow transition-all duration-700 ease-premium-ease ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                        <HelpCircle className="text-accent" />
                        Can I sell my receipt?
                    </h4>
                    <p className="text-slate-600 text-sm pl-7">No. It's a Soulbound Token (SBT) tied to your identity.</p>
                </div>
            </div>
        </div>
    );
}
