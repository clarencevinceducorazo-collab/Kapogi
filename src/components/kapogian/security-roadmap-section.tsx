import { ShieldCheck, MapPin, LockKeyhole, Server, CheckCheck } from "lucide-react";

export function SecurityRoadmapSection() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white comic-border-thick rounded-[2.5rem] p-8 toy-shadow flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-4">
                    <ShieldCheck className="w-10 h-10 text-green-500" strokeWidth={1.5} />
                    <h2 className="font-headline text-3xl">SECURE DATA</h2>
                </div>
                <div className="flex-grow flex flex-col space-y-4">
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 flex items-start gap-3">
                        <LockKeyhole className="text-slate-400 mt-1 w-5 h-5 flex-shrink-0" strokeWidth={2} />
                        <p className="text-sm font-medium"><strong>Client-Side Encryption:</strong> Your address is encrypted before it leaves your device.</p>
                    </div>
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 flex items-start gap-3">
                        <Server className="text-slate-400 mt-1 w-5 h-5 flex-shrink-0" strokeWidth={2} />
                        <p className="text-sm font-medium"><strong>On-Chain Storage:</strong> Only encrypted blobs are stored. No plain text databases.</p>
                    </div>
                    <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-xl border-2 border-slate-800 mt-auto">
                        &gt; STATUS: ENCRYPTED<br />
                        &gt; PROTOCOL: AES-256<br />
                        &gt; ACCESS: ADMIN ONLY
                    </div>
                </div>
            </div>

            <div className="bg-white comic-border-thick rounded-[2.5rem] p-8 toy-shadow flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-4">
                    <MapPin className="w-10 h-10 text-primary" strokeWidth={1.5} />
                    <h2 className="font-headline text-3xl">ROADMAP</h2>
                </div>
                <div className="relative pl-4 space-y-6">
                    <div className="absolute left-[27px] top-4 bottom-4 w-1 bg-slate-200 rounded-full"></div>

                    <div className="flex items-center gap-4 relative">
                        <div className="w-8 h-8 rounded-full bg-green-500 comic-border z-10 flex items-center justify-center text-white text-xs">
                            <CheckCheck className="w-4 h-4" strokeWidth={3} />
                        </div>
                        <div className="bg-[#f0fff4] border-2 border-green-200 rounded-xl p-3 flex-1">
                            <h4 className="font-bold text-sm">PHASE 1: GENESIS</h4>
                            <p className="text-xs text-slate-500">Character Engine Live</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 relative">
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--brand-yellow))] comic-border z-10 animate-pulse"></div>
                        <div className="bg-[#fff9db] border-2 border-yellow-200 rounded-xl p-3 flex-1 toy-shadow">
                            <h4 className="font-bold text-sm">PHASE 2: PHYSICAL</h4>
                            <p className="text-xs text-slate-500">Merch Shop Open</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 relative opacity-50">
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
