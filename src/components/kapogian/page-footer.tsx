'use client';

import Link from "next/link";
import { useInView } from "@/hooks/use-in-view";

export function PageFooter() {
    const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

    return (
        <footer ref={ref} className={`text-center font-bold text-slate-800 pb-8 max-w-6xl mx-auto px-4 transition-all duration-700 ease-premium-ease ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="bg-white inline-block px-6 py-2 rounded-full comic-border mb-4 toy-shadow">
                © 2026 KAPOGIAN
            </div>
            <div className="flex justify-center gap-6 text-sm">
                <Link href="#" className="hover:underline">TERMS</Link>
                <Link href="#" className="hover:underline">PRIVACY</Link>
                <Link href="#" className="hover:underline">SMART CONTRACT</Link>
            </div>
        </footer>
    );
}
