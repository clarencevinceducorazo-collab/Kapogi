import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  CheckCircle,
  Circle,
  Database,
  Lock,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

export const SecuritySection = () => {
  const roadmapChar = PlaceHolderImages.find(
    (img) => img.id === 'security-roadmap-char'
  );

  return (
    <section
      className="relative text-primary-foreground py-20 lg:py-32 overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #4DABF7, #2D6491)' }}
    >
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="relative mb-20 lg:mb-40 text-center">
          <div
            className="inline-block bg-primary border-[6px] border-black p-4 transform -rotate-3"
            style={{ boxShadow: '12px 12px 0 #000' }}
          >
            <h2
              className="font-headline text-4xl md:text-6xl font-bold text-white uppercase"
              style={{ textShadow: '3px 3px 0 #000' }}
            >
              Built for Security <br /> & Transparency
            </h2>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-36 max-w-7xl mx-auto items-start">
          {/* Roadmap Card */}
          <div className="relative">
            {roadmapChar && (
              <div className="absolute top-[-330px] left-1/2 -translate-x-1/2 z-0 w-[600px] h-[600px] hidden lg:block">
                <Image
                  src="https://picsum.photos/seed/rihee/600/600"
                  alt={roadmapChar.description}
                  fill
                  className="object-contain"
                  data-ai-hint={roadmapChar.imageHint}
                />
              </div>
            )}

            <div
              className="relative z-10 mt-8 bg-white text-black rounded-3xl border-4 border-black p-6 pt-8 transform -rotate-3"
              style={{ boxShadow: '8px 8px 0px #000' }}
            >
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="text-red-500 w-8 h-8" />
                <h3 className="font-headline text-2xl font-bold text-black">
                  ROADMAP
                </h3>
              </div>
              <div className="space-y-4 text-left">
                <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-bold">PHASE 1: GENESIS</p>
                    <p className="text-sm text-black/70">
                      Character Engine Live
                    </p>
                  </div>
                </div>
                <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3 flex items-center gap-3">
                  <Circle className="w-6 h-6 text-yellow-500" />
                  <div>
                    <p className="font-bold">PHASE 2: PHYSICAL</p>
                    <p className="text-sm text-black/70">Merch Shop Open</p>
                  </div>
                </div>
                <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-3 flex items-center gap-3">
                  <Circle className="w-6 h-6 text-gray-500" />
                  <div>
                    <p className="font-bold">PHASE 3: EXPANSION</p>
                    <p className="text-sm text-black/70">Holder-Only Drops</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secure Data Card */}
          <div className="relative">
            {roadmapChar && (
              <div className="absolute top-[-330px] left-1/2 -translate-x-1/2 z-30 w-[700px] h-[700px] hidden lg:block">
                <Image
                  src="https://picsum.photos/seed/rihe/700/700"
                  alt={roadmapChar.description}
                  fill
                  className="object-contain"
                  data-ai-hint={roadmapChar.imageHint}
                />
              </div>
            )}
            <div
              className="relative z-10 bg-white text-black rounded-3xl border-4 z-40 border-black 
                p-8 pt-10 w-full max-w-xl transform rotate-3"
              style={{ boxShadow: '8px 8px 0px #000' }}
            >
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="text-green-500 w-8 h-8" />
                <h3 className="font-headline text-2xl font-bold text-black">
                  SECURE DATA
                </h3>
              </div>
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <Lock className="w-10 h-10 text-black/70 mt-1" />
                  <div>
                    <p className="font-bold">Client-Side Encryption</p>
                    <p className="text-sm text-black/70">
                      Your address is encrypted before it leaves your device.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Database className="w-10 h-10 text-black/70 mt-1" />
                  <div>
                    <p className="font-bold">On-Chain Storage</p>
                    <p className="text-sm text-black/70">
                      Only encrypted blobs are stored. No plain text databases.
                    </p>
                  </div>
                </div>
                <div className="bg-black text-green-400 border border-green-500 rounded-lg p-4 font-code text-sm mt-4">
                  <p>&gt; STATUS: ENCRYPTED</p>
                  <p>&gt; PROTOCOL: AES-256</p>
                  <p>&gt; ACCESS: ADMIN ONLY</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p
          className="font-headline text-xl md:text-2xl font-bold text-white uppercase mt-24 max-w-4xl mx-auto"
          style={{ textShadow: '2px 2px 0 #000' }}
        >
          EACH MINT GENERATES A SOULBOUND RECEIPT NFT THAT SECURELY STORES YOUR
          ENCRYPTED SHIPPING DATA. THIS RECEIPT IS NON - TRANSFERABLE AND
          PROTECTS YOUR OWNERSHIP RIGHTS.
        </p>
      </div>
    </section>
  );
};
