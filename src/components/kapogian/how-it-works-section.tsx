import { Wallet, WandSparkles, Box } from "lucide-react";

export function HowItWorksSection() {
    return (
        <div className="mb-12">
            <div className="bg-white px-6 py-2 inline-block comic-border rounded-t-2xl border-b-0 ml-8 relative z-10">
                <h3 className="font-headline text-2xl">INSTRUCTIONS</h3>
            </div>
            <div className="bg-white comic-border-thick rounded-[2rem] rounded-tl-none p-8 md:p-10 toy-shadow relative z-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-[#f8f9fa] comic-border rounded-2xl p-6 flex flex-col items-center text-center group hover:bg-[#e7f5ff] transition-colors">
                        <div className="w-16 h-16 bg-white comic-border rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Wallet className="w-8 h-8" strokeWidth={1.5} />
                        </div>
                        <h4 className="font-headline text-xl mb-2">1. CONNECT</h4>
                        <p className="text-sm font-semibold text-slate-500">Link your SUI wallet to access the factory.</p>
                    </div>
                    <div className="bg-[#f8f9fa] comic-border rounded-2xl p-6 flex flex-col items-center text-center group hover:bg-[#fff9db] transition-colors">
                        <div className="w-16 h-16 bg-white comic-border rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <WandSparkles className="w-8 h-8" strokeWidth={1.5} />
                        </div>
                        <h4 className="font-headline text-xl mb-2">2. GENERATE</h4>
                        <p className="text-sm font-semibold text-slate-500">Create your unique 1/1 character.</p>
                    </div>
                    <div className="bg-[#f8f9fa] comic-border rounded-2xl p-6 flex flex-col items-center text-center group hover:bg-[#ffe3e3] transition-colors">
                        <div className="w-16 h-16 bg-white comic-border rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Box className="w-8 h-8" strokeWidth={1.5} />
                        </div>
                        <h4 className="font-headline text-xl mb-2">3. CLAIM</h4>
                        <p className="text-sm font-semibold text-slate-500">Mint and order your physical merch.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
