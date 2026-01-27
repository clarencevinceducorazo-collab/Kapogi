'use client';

import { BadgeCheck, Box, ShieldCheck, Shirt, CupSoda } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import { useState, useEffect } from 'react';

export function IntroSection() {
    const [ref, inView] = useInView({ threshold: 0.5, triggerOnce: false });
    
    const items = [
        { icon: BadgeCheck, text: "1-of-1 AI Generation", color: "text-green-600" },
        { icon: Box, text: "Token-Gated Physical Merch", color: "text-blue-600" },
        { icon: ShieldCheck, text: "Encrypted Shipping Data", color: "text-red-600" },
    ];

    const content = [
        {
            title: <>NOT JUST A JPEG. <br/>IT'S REAL STUFF.</>,
            description: "Kapogian is a manufacturing facility on the blockchain. We mint identity and ship physical goods."
        },
        {
            title: <>FROM PIXELS <br/>TO PARCELS.</>,
            description: "Your unique digital creation, delivered to your doorstep. Experience the future of collecting."
        },
        {
            title: <>OWN THE CODE. <br/>GET THE GOODS.</>,
            description: "Every mint is a 1-of-1 digital soul with a physical counterpart. Your identity, made tangible."
        }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % content.length);
                setIsFading(false);
            }, 500); // This should match the transition duration
        }, 5000); // 5 seconds

        return () => clearInterval(interval);
    }, [content.length]);

    return (
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className={`relative h-64 md:h-80 bg-white comic-border rounded-3xl p-6 transform -rotate-1 toy-shadow transition-all duration-800 ease-premium-ease ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-200 w-20 h-6 rounded-full border-2 border-gray-300"></div>
                <div className="h-full w-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden">
                    <Shirt className="absolute top-4 left-4 text-primary sticker-cut w-12 h-12" strokeWidth={1.5} />
                    <CupSoda className="absolute bottom-6 right-6 text-accent sticker-cut w-14 h-14" strokeWidth={1.5} />
                    <video src="/videos/merch.mp4" autoPlay loop muted playsInline className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 object-contain" />
                </div>
                <div className="absolute bottom-2 right-4 text-[10px] font-bold text-slate-400">FIG 1.0: MERCH BUNDLE</div>
            </div>

            <div className={`transition-all duration-800 delay-200 ease-premium-ease ${inView ? 'opacity-100' : 'opacity-0'}`}>
                <div className={`transition-opacity duration-500 min-h-[180px] ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                    <h2 className="font-headline text-4xl mb-4">{content[currentIndex].title}</h2>
                    <p className="font-medium text-slate-800 mb-6 text-lg">
                        {content[currentIndex].description}
                    </p>
                </div>
                <ul className="space-y-4">
                    {items.map((item, index) => (
                        <li key={index} style={{transitionDelay: `${index * 150}ms`}} className={`flex items-center gap-3 bg-white/50 p-2 rounded-lg border-2 border-black/10 overflow-hidden transition-all duration-500 ease-premium-ease ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'}`}>
                            <div className="relative w-6 h-6 flex items-center justify-center">
                                <div className={`absolute inset-0 bg-white/50 rounded-md transition-all duration-500 ease-premium-ease ${inView ? 'w-full' : 'w-0'}`} style={{transitionDelay: `${200 + index * 150}ms`}}/>
                                <item.icon className={cn(`${item.color} w-6 h-6 relative opacity-0`, inView && "animate-icon-bounce")} style={{animationDelay: `${350 + index * 150}ms`}} strokeWidth={1.5} />
                            </div>
                            <span className="font-bold">{item.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
