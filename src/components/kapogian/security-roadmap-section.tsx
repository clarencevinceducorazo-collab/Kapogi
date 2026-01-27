'use client';

import { ShieldCheck, MapPin, LockKeyhole, Server, CheckCheck } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";

export function SecurityRoadmapSection() {
    const [secureRef, secureInView] = useInView({ threshold: 0.5, triggerOnce: true });
    const [roadmapRef, roadmapInView] = useInView({ threshold: 0.3, triggerOnce: true });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div ref={secureRef} className="bg-white comic-border-thick rounded-[2.5rem] p-8 toy-shadow flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-4">
                    <ShieldCheck className="w-10 h-10 text-green-500" strokeWidth={1.5} />
                    <h2 className="font-headline text-3xl">SECURE DATA</h2>
                </div>
                <div className="flex-grow flex flex-col space-y-4">
                    <div className={`bg-slate-50 border-2 border-slate-200 rounded-xl p-4 flex items-start gap-3 transition-all duration-500 ease-premium-ease ${secureInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                        <LockKeyhole className="text-slate-400 mt-1 w-5 h-5 flex-shrink-0" strokeWidth={2} />
                        <p className="text-sm font-medium"><strong>Client-Side Encryption:</strong> Your address is encrypted before it leaves your device.</p>
                    </div>
                    <div style={{ transitionDelay: '150ms' }} className={`bg-slate-50 border-2 border-slate-200 rounded-xl p-4 flex items-start gap-3 transition-all duration-500 ease-premium-ease ${secureInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                        <Server className="text-slate-400 mt-1 w-5 h-5 flex-shrink-0" strokeWidth={2} />
                        <p className="text-sm font-medium"><strong>On-Chain Storage:</strong> Only encrypted blobs are stored. No plain text databases.</p>
                    </div>
                    <div style={{ transitionDelay: '300ms' }} className={`bg-black text-green-400 font-mono text-xs p-4 rounded-xl border-2 border-slate-800 mt-auto transition-all duration-500 ease-premium-ease ${secureInView ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="relative">
                            <span className={`transition-opacity duration-500 ${secureInView ? 'opacity-100' : 'opacity-0'}`}>&gt; STATUS: </span>
                            <span className={`inline-block text-white font-bold transition-opacity duration-500 delay-500 ${secureInView ? 'opacity-100 animate-soft-pulse' : 'opacity-0'}`}>ENCRYPTED</span>
                        </div>
                        <div className={`transition-opacity duration-500 delay-200 ${secureInView ? 'opacity-100' : 'opacity-0'}`}>&gt; PROTOCOL: AES-256</div>
                        <div className={`transition-opacity duration-500 delay-300 ${secureInView ? 'opacity-100' : 'opacity-0'}`}>&gt; ACCESS: ADMIN ONLY</div>
                    </div>
                </div>
            </div>

            <div ref={roadmapRef} className="bg-white comic-border-thick rounded-[2.5rem] p-8 toy-shadow flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-4">
                    <MapPin className="w-10 h-10 text-primary" strokeWidth={1.5} />
                    <h2 className="font-headline text-3xl">ROADMAP</h2>
                </div>
                <div className="relative pl-4 space-y-6">
                    <div className="absolute left-[27px] top-4 bottom-4 w-1 bg-slate-200 rounded-full origin-top animate-draw-line" style={{ animationPlayState: roadmapInView ? 'running' : 'paused' }}></div>

                    <div style={{ transitionDelay: '300ms' }} className={`flex items-center gap-4 relative transition-all duration-500 ease-premium-ease ${roadmapInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                        <div className="w-8 h-8 rounded-full bg-green-500 comic-border z-10 flex items-center justify-center text-white text-xs">
                            <CheckCheck className="w-4 h-4" strokeWidth={3} />
                        </div>
                        <div className="bg-[#f0fff4] border-2 border-green-200 rounded-xl p-3 flex-1">
                            <h4 className="font-bold text-sm">PHASE 1: GENESIS</h4>
                            <p className="text-xs text-slate-500">Character Engine Live</p>
                        </div>
                    </div>
                    <div style={{ transitionDelay: '500ms' }} className={`flex items-center gap-4 relative transition-all duration-500 ease-premium-ease ${roadmapInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--brand-yellow))] comic-border z-10 animate-pulse"></div>
                        <div className="bg-[#fff9db] border-2 border-yellow-200 rounded-xl p-3 flex-1 toy-shadow">
                            <h4 className="font-bold text-sm">PHASE 2: PHYSICAL</h4>
                            <p className="text-xs text-slate-500">Merch Shop Open</p>
                        </div>
                    </div>
                    <div style={{ transitionDelay: '700ms' }} className={`flex items-center gap-4 relative transition-all duration-500 ease-premium-ease ${roadmapInView ? 'opacity-50 ' : 'opacity-0 -translate-x-4 blur-sm'}`}>
                        <div className="w-8 h-8 rounded-full bg-slate-200 comic-border z-10"></div>
                        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 flex-1">
                            <h4 className="font-bold text-sm">PHASE 3: EXPANSION</h4>
                            <p className="text-xs text-slate-500">Holder-Only Drops</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
