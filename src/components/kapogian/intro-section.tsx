import { BadgeCheck, Box, ShieldCheck, Shirt, CupSoda } from "lucide-react";

export function IntroSection() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-64 md:h-80 bg-white comic-border rounded-3xl p-6 transform -rotate-1 toy-shadow">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-200 w-20 h-6 rounded-full border-2 border-gray-300"></div>
                <div className="h-full w-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden">
                    <Shirt className="absolute top-4 left-4 text-primary sticker-cut w-12 h-12" strokeWidth={1.5} />
                    <CupSoda className="absolute bottom-6 right-6 text-accent sticker-cut w-14 h-14" strokeWidth={1.5} />
                    <video src="/videos/merch.mp4" autoPlay loop muted playsInline className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 object-contain" />
                </div>
                <div className="absolute bottom-2 right-4 text-[10px] font-bold text-slate-400">FIG 1.0: MERCH BUNDLE</div>
            </div>

            <div>
                <h2 className="font-headline text-4xl mb-4">NOT JUST A JPEG. <br/>IT'S REAL STUFF.</h2>
                <p className="font-medium text-slate-800 mb-6 text-lg">
                    Kapogian is a manufacturing facility on the blockchain. We mint identity and ship physical goods.
                </p>
                <ul className="space-y-4">
                    <li className="flex items-center gap-3 bg-white/50 p-2 rounded-lg border-2 border-black/10">
                        <BadgeCheck className="text-green-600 w-6 h-6" strokeWidth={1.5} />
                        <span className="font-bold">1-of-1 AI Generation</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white/50 p-2 rounded-lg border-2 border-black/10">
                        <Box className="text-blue-600 w-6 h-6" strokeWidth={1.5} />
                        <span className="font-bold">Token-Gated Physical Merch</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white/50 p-2 rounded-lg border-2 border-black/10">
                        <ShieldCheck className="text-red-600 w-6 h-6" strokeWidth={1.5} />
                        <span className="font-bold">Encrypted Shipping Data</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
